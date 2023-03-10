import express, {Request, Response} from "express";
import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  requireAuth,
  validateRequest
} from "@campus-market/common";
import {body} from "express-validator";
import mongoose from "mongoose";
import {Order} from "../models/order";
import {Item} from "../models/item";
import {OrderCreatedPublisher} from "../events/publishers/order-created-publisher";
import {natsWrapper} from "../nats-wrapper";
import {OrderCancelledPublisher} from "../events/publishers/order-cancelled-publisher";

const EXPIRATION_WINDOW_SECONDS = 15 * 60;

const router = express.Router();

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response) => {
    const orders = await Order.find({userId: req.currentUser!.id}).populate('item');

    res.send(orders);
  }
);

router.get(
  '/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.orderId).populate('item');

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId != req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    res.send(order);
  }
);

router.post(
  '/',
  [
    body('itemId')
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('Item ID must be provided.')
  ],
  validateRequest,
  requireAuth,
  async (req: Request, res: Response) => {
    const {itemId} = req.body;
    const item = await Item.findById(itemId);
    if (!item) {
      throw new NotFoundError();
    }

    if (await item.isReserved()) {
      throw new BadRequestError('Item has been reserved.');
    }

    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expirationTime,
      item: item
    });

    await order.save();

    await new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      item: {
        id: item.id,
        price: item.price
      }
    });

    res.status(201).send(order);
  }
);

router.delete(
  '/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.orderId).populate('item');

    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId != req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    order.status = OrderStatus.Cancelled;
    await order.save();
    await new OrderCancelledPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      item: {
        id: order.item.id
      }
    });

    res.status(204).send(order);
  }
);

export {router as ordersRouter};
import {ExpirationCompleteListener} from "../expiration-complete-listener";
import {natsWrapper} from "../../../nats-wrapper";
import {Item} from "../../../models/item";
import mongoose from "mongoose";
import {Order} from "../../../models/order";
import {ExpirationCompleteEvent, OrderStatus} from "@campus-market/common";
import {Message} from "node-nats-streaming";

const setup = async () => {
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  const item = Item.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'mbp',
    price: 20
  });

  await item.save();

  const order = Order.build({
    status: OrderStatus.Created,
    userId: 'asdf',
    expiresAt: new Date(),
    item: item
  });

  await order.save();

  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id
  };

  // @ts-ignore
  const message: Message = {
    ack: jest.fn()
  };

  return {listener, item, order, data, message};
};

it('should update the order status to cancelled, emit an OrderCancelled event, and ack the message', async () => {
  const {listener, item, order, data, message} = await setup();

  await listener.onMessage(data, message);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
  const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
  expect(eventData.id).toEqual(order.id);

  expect(message.ack).toHaveBeenCalled();
});
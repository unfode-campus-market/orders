import {ExpirationCompleteEvent, Listener, OrderStatus, Subjects} from "@campus-market/common";
import {Message} from "node-nats-streaming";
import {queueGroupName} from "./queue-group-name";
import {Order} from "../../models/order";
import {OrderCancelledPublisher} from "../publishers/order-cancelled-publisher";
import {natsWrapper} from "../../nats-wrapper";


export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent['data'], message: Message) {
    const order = await Order.findById(data.orderId).populate('item');
    if (!order) {
      throw new Error('order not found');
    }

    if (order.status === OrderStatus.Complete) {
      message.ack();
      return;
    }

    order.set({status: OrderStatus.Cancelled});
    await order.save();

    await new OrderCancelledPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      item: {
        id: order.item.id
      }
    });

    message.ack();
  }
}
import {ItemUpdatedEvent, Listener, Subjects} from "@campus-market/common";
import {queueGroupName} from "./queue-group-name";
import {Message} from "node-nats-streaming";
import {Item} from "../../models/item";


export class ItemUpdatedListener extends Listener<ItemUpdatedEvent>{
  readonly subject = Subjects.ItemUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: ItemUpdatedEvent["data"], msg: Message) {
    const item = await Item.findByEvent(data);

    if (!item) {
      throw new Error('Item not found');
    }

    item.set({
      title: data.title,
      price: data.price
    });

    await item.save();

    msg.ack();
  }
}
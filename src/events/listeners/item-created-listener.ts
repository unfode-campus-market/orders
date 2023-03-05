import {ItemCreatedEvent, Listener, Subjects} from "@campus-market/common";
import {Message} from "node-nats-streaming";
import {queueGroupName} from "./queue-group-name";
import {Item} from "../../models/item";


export class ItemCreatedListener extends Listener<ItemCreatedEvent> {

  readonly subject = Subjects.ItemCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: ItemCreatedEvent["data"], msg: Message) {
    const {id, title, price} = data;
    const item = Item.build({
      id: id,
      title: title,
      price: price
    });
    await item.save();

    msg.ack();
  }
}
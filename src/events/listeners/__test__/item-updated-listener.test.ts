import {natsWrapper} from "../../../nats-wrapper";
import {ItemUpdatedEvent} from "@campus-market/common";
import mongoose from "mongoose";
import {Message} from "node-nats-streaming";
import {Item} from "../../../models/item";
import {ItemUpdatedListener} from "../item-updated-listener";


const setup = async () => {
  const listener = new ItemUpdatedListener(natsWrapper.client);

  const item = Item.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'mbp',
    price: 10
  });
  await item.save();

  const data: ItemUpdatedEvent['data'] = {
    id: item.id,
    version: item.version + 1,
    title: item.title,
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString()
  };
  // @ts-ignore
  const message: Message = {
    ack: jest.fn()
  };

  return {listener, item, data, message};
};

it('should update an item', async () => {
  const {listener, item, data, message} = await setup();

  await listener.onMessage(data, message);

  const updatedItem = await Item.findById(item.id);

  expect(updatedItem!.price).toEqual(data.price);
  expect(updatedItem!.version).toEqual(data.version);
  expect(message.ack).toHaveBeenCalled();
});

it('should not call ack if the event has a skipped version number', async () => {
  const {listener, data, message} = await setup();
  data.version = 10;
  try {
    await listener.onMessage(data, message);
  } catch (e) {

  }

  expect(message.ack).not.toHaveBeenCalled();
});
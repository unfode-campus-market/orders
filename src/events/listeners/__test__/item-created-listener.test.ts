import {ItemCreatedListener} from "../item-created-listener";
import {natsWrapper} from "../../../nats-wrapper";
import {ItemCreatedEvent} from "@campus-market/common";
import mongoose from "mongoose";
import {Message} from "node-nats-streaming";
import {Item} from "../../../models/item";

const setup = async () => {
  const listener = new ItemCreatedListener(natsWrapper.client);
  const data: ItemCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    title: 'mbp',
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString()
  };
  // @ts-ignore
  const message: Message = {
    ack: jest.fn()
  };

  return {listener, data, message};
};

it('should create and save a ticket', async () => {
  const {listener, data, message} = await setup();
  await listener.onMessage(data, message);

  const item = await Item.findById(data.id);

  expect(item!.title).toEqual(data.title);
  expect(item!.price).toEqual(data.price);
  expect(message.ack).toHaveBeenCalled();
});
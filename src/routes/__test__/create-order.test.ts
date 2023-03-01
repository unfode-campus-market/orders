import mongoose from "mongoose";
import request from 'supertest';
import {app} from "../../app";
import {Item} from "../../models/item";
import {Order} from "../../models/order";
import {OrderStatus} from "@campus-market/common";
import {natsWrapper} from "../../nats-wrapper";


// happy cases
it('should reserve the item associated with the order if everything is valid', async () => {
  const item = Item.build({
    title: 'MacBook',
    price: 1000
  });
  await item.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signup())
    .send({itemId : item.id})
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

// sad cases
it('should return an error if the item associated with the order does not exist', async () => {
  const itemId = new mongoose.Types.ObjectId();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signup())
    .send({itemId: itemId})
    .expect(404);
});

it('should return an error if the item associated with the order has been reserved', async () => {
  const item = Item.build({
    title: 'MacBook',
    price: 1000
  });
  await item.save();

  const order = Order.build({
    userId: 'lsjflsjafsjfpe',
    status: OrderStatus.Created,
    expiresAt: new Date(),
    item: item
  });
  await order.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signup())
    .send({itemId : item.id})
    .expect(400);
});




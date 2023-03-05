import request from "supertest";
import {Item} from "../../models/item";
import {app} from "../../app";
import mongoose from "mongoose";

// happy cases
it('should return the order with the specified ID if nothing goes wrong', async () => {
  const item = Item.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'MacBook',
    price: 1000
  });
  await item.save();

  const user = global.signup();

  const {body: createdOrder} = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({itemId: item.id})
    .expect(201);

  const {body: fetchedOrder} = await request(app)
    .get(`/api/orders/${createdOrder.id}`)
    .set('Cookie', user)
    .expect(200);

  expect(fetchedOrder.id).toEqual(createdOrder.id);
});

// sad cases
it('should return a 404 error if there does exist an order with the specified ID', async () => {
  await request(app)
    .get(`/api/orders/${new mongoose.Types.ObjectId()}`)
    .set('Cookie', global.signup())
    .expect(404);
});

it('should return a 401 error if the order associated with the order ID was not created by the current user', async () => {
  const item = Item.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'MacBook',
    price: 1000
  });
  await item.save();

  const user1 = global.signup();

  const {body: createdOrder} = await request(app)
    .post('/api/orders')
    .set('Cookie', user1)
    .send({itemId: item.id})
    .expect(201);

  const user2 = global.signup();

  await request(app)
    .get(`/api/orders/${createdOrder.id}`)
    .set('Cookie', user2)
    .expect(401);
}); 


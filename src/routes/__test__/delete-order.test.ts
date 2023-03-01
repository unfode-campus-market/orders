import request from "supertest";
import {Item} from "../../models/item";
import {app} from "../../app";
import {Order} from "../../models/order";
import {OrderStatus} from "@campus-market/common";

// happy cases
it('should set the status of the order to cancelled', async () => {
  const item = Item.build({
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

  await request(app)
    .delete(`/api/orders/${createdOrder.id}`)
    .set('Cookie', user)
    .expect(204);

  const updatedOrder = await Order.findById(createdOrder.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it.todo('should emit an order cancelled event');
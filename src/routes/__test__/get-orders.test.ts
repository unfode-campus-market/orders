import request from "supertest";
import {Item} from "../../models/item";
import {app} from "../../app";

const buildDummyItem = async () => {
  const item = Item.build({
    title: 'MacBook',
    price: 2000
  });

  await item.save();
  return item;
};

it('should fetch orders for a particular user', async () => {
  const user1 = global.signup();
  const user1Item1 = await buildDummyItem();

  await request(app)
    .post('/api/orders')
    .set('Cookie', user1)
    .send({itemId: user1Item1.id})
    .expect(201);

  const user2 = global.signup();
  const user2Item1 = await buildDummyItem();
  const user2Item2 = await buildDummyItem();

  const {body: user2Item1Order} = await request(app)
    .post('/api/orders')
    .set('Cookie', user2)
    .send({itemId: user2Item1.id})
    .expect(201);

  const {body: user2Item2Order} = await request(app)
    .post('/api/orders')
    .set('Cookie', user2)
    .send({itemId: user2Item2.id})
    .expect(201);

  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', user2)
    .expect(200);

  expect(response.body.length).toEqual(2);

  expect(response.body[0].id).toEqual(user2Item1Order.id);
  expect(response.body[0].item.id).toEqual(user2Item1.id);

  expect(response.body[1].id).toEqual(user2Item2Order.id);
  expect(response.body[1].item.id).toEqual(user2Item2.id);
});
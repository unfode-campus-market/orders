import mongoose from 'mongoose';

import {app} from "./app";
import {natsWrapper} from "./nats-wrapper";
import {ItemCreatedListener} from "./events/listeners/item-created-listener";
import {ItemUpdatedListener} from "./events/listeners/item-updated-listener";
import {ExpirationCompleteListener} from "./events/listeners/expiration-complete-listener";
import {PaymentCreatedListener} from "./events/listeners/payment-created-listener";

const start = async () => {
  // check environment variables are defined
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID is not defined.');
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID is not defined.');
  }
  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL is not defined.');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined.');
  }
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY is not defined.');
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed.');
      process.exit();
    });
    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    new ItemCreatedListener(natsWrapper.client).listen();
    new ItemUpdatedListener(natsWrapper.client).listen();
    new ExpirationCompleteListener(natsWrapper.client).listen();
    new PaymentCreatedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error(error);
  }
  
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}!!!`);
  });
};

start();
import mongoose from "mongoose";
import {Order} from "./order";
import {OrderStatus} from "@campus-market/common";

interface ItemAttributes {
  title: string;
  price: number;
}

interface ItemDocument extends mongoose.Document {
  title: string;
  price: number;
  isReserved(): Promise<boolean>;
}

interface ItemModel extends mongoose.Model<ItemDocument> {
  build(attributes: ItemAttributes): ItemDocument;
}

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);

itemSchema.statics.build = (attributes: ItemAttributes) => {
  return new Item(attributes);
};

itemSchema.methods.isReserved = async function () {
  const existingOrder = await Order.findOne({
    item: this,
    status: {
      $in: [OrderStatus.Created, OrderStatus.AwaitingPayment, OrderStatus.Complete]
    }
  });

  return existingOrder != null;
};

const Item = mongoose.model<ItemDocument, ItemModel>('Item', itemSchema);

export {Item, ItemDocument}
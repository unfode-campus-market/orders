import mongoose from "mongoose";
import {Order} from "./order";
import {OrderStatus} from "@campus-market/common";
import {updateIfCurrentPlugin} from "mongoose-update-if-current";

interface ItemAttributes {
  id: string;
  title: string;
  price: number;
}

interface ItemDocument extends mongoose.Document {
  title: string;
  price: number;
  version: number;
  isReserved(): Promise<boolean>;
}

interface ItemModel extends mongoose.Model<ItemDocument> {
  build(attributes: ItemAttributes): ItemDocument;
  findByEvent(event: {id: string, version: number}): Promise<ItemDocument | null>;
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

itemSchema.set('versionKey', 'version');
itemSchema.plugin(updateIfCurrentPlugin);

itemSchema.statics.build = (attributes: ItemAttributes) => {
  return new Item({
    _id: attributes.id,
    title: attributes.title,
    price: attributes.price
  });
};

itemSchema.statics.findByEvent = (event: {id: string, version: number}) => {
  return Item.findOne({
    _id: event.id,
    version: event.version - 1
  });
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
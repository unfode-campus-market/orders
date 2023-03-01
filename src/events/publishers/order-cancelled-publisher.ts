import {OrderCancelledEvent, Publisher, Subjects} from "@campus-market/common";


export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
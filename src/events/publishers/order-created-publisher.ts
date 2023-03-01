import {OrderCreatedEvent, Publisher, Subjects} from "@campus-market/common";


export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}
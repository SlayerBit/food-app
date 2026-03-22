export interface PlaceOrderPayload {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

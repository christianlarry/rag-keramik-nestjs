import { ApplicationArea, FinishingType, Grade } from "../../domain";
import { ProductItem } from "./product-item.interface";

export type ProductListItem = Omit<ProductItem, 'description' | 'attributes' | 'createdAt' | 'updatedAt'> & {
  attributes: {
    grade?: Grade;
    finishing?: FinishingType;
    applicationAreas?: ApplicationArea[];
  };
};
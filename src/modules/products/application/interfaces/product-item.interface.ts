import { ApplicationArea, FinishingType, Grade } from "../../domain";

export interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  tilePerBox: number;
  status: string;
  size: {
    width: number;
    height: number;
    thickness: number | null;
    unit: string;
  };
  attributes: {
    grade?: Grade;
    finishing?: FinishingType;
    applicationAreas?: ApplicationArea[];
    antiSlipRating?: string;
    waterAbsorption?: string;
    color?: string;
    pattern?: string;
    isOutdoor?: boolean;
    frostResistant?: boolean;
    peiRating?: number;
  };
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date | null;
}
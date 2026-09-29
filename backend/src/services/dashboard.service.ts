import { Enquiry, ENQUIRY_STATUS } from "../models/enquiry.model.js";
import { ProductionOrder, OPEN_ORDER_STATUSES } from "../models/productionOrder.model.js";
import { Company } from "../models/company.model.js";
import { GalleryImage } from "../models/galleryImage.model.js";

export interface StatTile {
  key: string;
  label: string;
  value: number;
  hint: string;
}

export interface RecentEnquiry {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  status: string;
  createdAt: Date;
}

export interface DashboardStats {
  tiles: StatTile[];
  recentEnquiries: RecentEnquiry[];
  generatedAt: Date;
}

const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

/**
 * Real counts for the dashboard.
 *
 * Every figure here is a live count from a collection this panel actually
 * owns. The previous version returned hardcoded zeros plus empty "top
 * products" and "channels" panels — placeholders for analytics that were
 * never wired up, and which a client reading the screen would reasonably
 * mistake for real traffic data.
 *
 * All counts issue in parallel: they are independent, and serially they would
 * make the dashboard's first paint wait on the sum of every round trip.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const weekAgo = daysAgo(7);

  const [
    newEnquiries,
    enquiriesThisWeek,
    activeOrders,
    companies,
    galleryImages,
    recent,
  ] = await Promise.all([
    Enquiry.countDocuments({ status: ENQUIRY_STATUS.NEW }).exec(),
    Enquiry.countDocuments({ createdAt: { $gte: weekAgo } }).exec(),
    /*
     * Reuses the model's own OPEN_ORDER_STATUSES rather than a list spelled
     * out here, so this tile cannot drift from whatever the rest of the app
     * considers an open order.
     */
    ProductionOrder.countDocuments({ status: { $in: OPEN_ORDER_STATUSES } }).exec(),
    Company.countDocuments({ isActive: true }).exec(),
    GalleryImage.countDocuments().exec(),
    Enquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email company message status createdAt")
      .lean()
      .exec(),
  ]);

  return {
    tiles: [
      {
        key: "newEnquiries",
        label: "New enquiries",
        value: newEnquiries,
        hint: newEnquiries ? "Waiting for a reply" : "All caught up",
      },
      {
        key: "enquiriesThisWeek",
        label: "Enquiries this week",
        value: enquiriesThisWeek,
        hint: "Last 7 days",
      },
      {
        key: "activeOrders",
        label: "Orders in progress",
        value: activeOrders,
        hint: "Not yet completed",
      },
      {
        key: "companies",
        label: "Buyers",
        value: companies,
        hint: "Active companies",
      },
      {
        key: "galleryImages",
        label: "Gallery images",
        value: galleryImages,
        hint: "Live on the site",
      },
    ],

    recentEnquiries: recent.map((e) => ({
      id: String(e._id),
      name: e.name,
      email: e.email,
      company: e.company,
      message: e.message,
      status: e.status,
      createdAt: e.createdAt,
    })) as RecentEnquiry[],

    generatedAt: new Date(),
  };
};

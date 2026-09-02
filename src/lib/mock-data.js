export const demoUser = {
  uid: "demo-user",
  displayName: "Victor",
  email: "victor@example.com",
  emailVerified: true,
  plan: "trial",
  trialEndsAt: null
};

export const conversionJobs = [
  {
    id: "job_1042",
    fileName: "launch-teaser.mp4",
    targetRatio: "9:16",
    status: "completed",
    progress: 100,
    size: "84 MB",
    createdAt: "2026-07-13 09:20",
    downloadUrl: "#"
  },
  {
    id: "job_1041",
    fileName: "product-demo.mov",
    targetRatio: "1:1",
    status: "processing",
    progress: 68,
    size: "126 MB",
    createdAt: "2026-07-13 08:44",
    downloadUrl: "#"
  },
  {
    id: "job_1038",
    fileName: "client-ad.mp4",
    targetRatio: "16:9",
    status: "queued",
    progress: 12,
    size: "210 MB",
    createdAt: "2026-07-12 18:06",
    downloadUrl: "#"
  }
];

export const analytics = [
  { label: "Conversions", value: "128", delta: "+18 this week" },
  { label: "Storage used", value: "7.4 GB", delta: "42% of quota" },
  { label: "Avg. processing", value: "2m 14s", delta: "HD exports" },
  { label: "Trial days left", value: "14", delta: "Upgrade anytime" }
];

export const plans = [
  {
    id: "monthly",
    name: "Creator Monthly",
    price: "₦3,700",
    cadence: "month",
    features: ["100 conversions", "10 GB storage", "HD downloads", "Email support"]
  },
  {
    id: "yearly",
    name: "Studio Yearly",
    price: "₦44,400",
    cadence: "year",
    features: ["1,500 conversions", "100 GB storage", "Priority queue", "Team-ready billing"]
  }
];

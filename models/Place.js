import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema(
  {
    // Unique id from the extension (Google placeId / ftid / url) -> upserts, no duplicates
    key: { type: String, required: true, unique: true },

    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5 },
    reviews: { type: Number, min: 0 },

    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    emails: { type: [String], default: undefined },
    plusCode: { type: String, trim: true },
    hours: { type: String, trim: true },
    hoursTable: { type: [String], default: undefined },

    lat: Number,
    lng: Number,
    geo: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined }
    },

    placeId: String,
    ftid: String,
    url: String,

    query: String,
    searchLocation: String,
    searches: { type: [String], default: undefined },

    scrapedAt: Date,
    exportedAt: Date, // Track when this record was last exported
    status: { type: String, enum: ['pending', 'done'], default: 'pending' } // Lead status
  },
  { timestamps: true, versionKey: false }
);

placeSchema.index({ geo: '2dsphere' });
placeSchema.index({ placeId: 1 }, { sparse: true });
placeSchema.index({ category: 1 });
placeSchema.index({ email: 1 }, { sparse: true });
placeSchema.index({ searchLocation: 1, query: 1 });
placeSchema.index({ createdAt: -1 });
placeSchema.index({ scrapedAt: -1 });
placeSchema.index({ status: 1 });

export default mongoose.models.Place || mongoose.model('Place', placeSchema);

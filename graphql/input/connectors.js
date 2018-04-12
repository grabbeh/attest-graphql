import mongoose from 'mongoose'
// import timestamps from 'mongoose-timestamp'
const db = require('../../config/db.js')

try {
  mongoose.connect(db, { useMongoClient: true })
} catch (error) {
  console.log(error)
}

mongoose.Promise = require('bluebird')

let Schema = mongoose.Schema

const ContractSchema = mongoose.Schema({
  active: { type: Boolean, default: true },
  ownerEntity: String,
  masterEntityID: String,
  internalParties: Array,
  externalParties: Array,
  expiryDate: Date,
  effectiveDate: Date,
  executionDate: Date,
  rollingTerm: Boolean,
  tags: [
    {
      name: String,
      color: String,
      _id: false
    }
  ],
  businessUnit: {
    name: String,
    color: String,
    _id: false
  },
  currentStatus: {
    name: String,
    date: Date,
    color: String,
    _id: false
  },
  statuses: [
    {
      name: String,
      date: Date,
      color: String,
      _id: false
    }
  ],
  updatedAt: Date,
  createdAt: { type: Date, default: Date.now },
  client: Boolean,
  supplier: Boolean,
  // assignedTo may not always be ID so population potentially not always possible
  assignedTo: { type: Schema.Types.ObjectId, ref: 'user' }
})

const Contract = mongoose.model('contract', ContractSchema)

const UserSchema = mongoose.Schema({
  email: String,
  name: String,
  password: String,
  masterEntityID: String,
  isLawyer: Boolean,
  isAdmin: Boolean,
  favourites: Array
})

// UserSchema.plugin(timestamps)

const User = mongoose.model('user', UserSchema)

const MasterEntitySchema = mongoose.Schema({
  name: String,
  businessUnits: [
    {
      name: String,
      color: String
    }
  ],
  statuses: [
    {
      name: String,
      date: Date,
      color: String
    }
  ],
  tags: [{ name: String, color: String }],
  lawyers: Array,
  relatedEntities: Array
})

const MasterEntity = mongoose.model('masterEntity', MasterEntitySchema)

const NotificationSchema = mongoose.Schema({
  readBy: Array,
  masterEntityID: Schema.Types.ObjectId,
  relatedContract: { type: Schema.Types.ObjectId, ref: 'contract' },
  action: String,
  relatedUser: { type: Schema.Types.ObjectId, ref: 'user' },
  changes: Array,
  createdAt: { type: Date, default: Date.now }
})

// NotificationSchema.plugin(timestamps)

const Notification = mongoose.model('notification', NotificationSchema)
export { Contract, User, MasterEntity, Notification }
/*
User.find().exec((err, users) => {
  console.log(users)
  if (err) console.log(err)
  users.forEach(c => {
    c.favourites = []
    User.findByIdAndUpdate(c._id, c, () => {})
  })
})
/*
Notification.find().exec((err, notifications) => {
  notifications.forEach(n => {
    n.remove()
  })
})
*/

import mongoose from 'mongoose'

mongoose.Promise = require('bluebird')

let Schema = mongoose.Schema

const ContractSchema = mongoose.Schema({
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
  lastUpdated: Date,
  client: Boolean,
  supplier: Boolean,
  // assignedTo may not always be ID so population potentially not always possible
  assignedTo: { type: Schema.Types.ObjectId, ref: 'user' }
  // assignedTo: String
})

const Contract = mongoose.model('contract', ContractSchema)

const UserSchema = mongoose.Schema({
  email: String,
  name: String,
  password: String,
  masterEntityID: String,
  isLawyer: Boolean,
  isAdmin: Boolean
})

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
  changes: Object
})

const Notification = mongoose.model('notification', NotificationSchema)
export { Contract, User, MasterEntity, Notification }
/*
Notification.find().exec((err, notifications) => {
  if (err) console.log(err)
  notifications.forEach(n => {
    n.remove()
  })
})
/*
const contracts = generator(100)

contracts.forEach(c => {
  new Contract(c).save((err, res) => {
    if (err) console.log(err)
  })
})
*/

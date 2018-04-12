import { makeExecutableSchema } from 'graphql-tools'
import resolvers from '../resolvers'

const typeDefs = `
type Query {
  contracts: [Contract]
  contract(id: ID!): Contract
  masterEntity: MasterEntity
  allUsers: [User]
  user: User
  currentTags: [Tag]
  currentBusinessUnits: [BusinessUnit]
  currentLawyers: [User]
  currentStatuses: [Status]
  allUsers: [User]
  allNotifications: [Notification]
}

type Mutation {
  addContract(contract: PostContract): Contract
  updateContract(contract: PostContractWithID): Contract
  deleteContract(id: ID!): Contract
  deleteUser(id: String!): User
  addUser(user: PostUser): User
  updateUser(user: PostUserWithID): User
  createInitialAccount(name: String!, email: String!, password: String!): String
  updateMasterEntity(masterEntity: PostMasterEntity): MasterEntity
  updateNotification(id: String): Notification
  login(email: String!, password: String!): String
}

type Notification {
  readBy: [String]
  masterEntityID: String
  relatedContract: Contract
  action: String
  relatedUser: User
  id: ID
  changes: [Change]
  createdAt: Date
}

type Change {
  attr: String
  added: Added
  removed: Removed
}

type Added {
  email: String
  name: String
  color: String
  date: Date
  change: String
}

type Removed {
  email: String
  name: String
  color: String
  date: Date
  change: String
}

type MasterEntity {
  id: ID
  name: String
  businessUnits: [BusinessUnit]
  tags: [Tag]
  statuses: [Status]
  relatedEntities: [String]
}

input PostMasterEntity {
  name: String
  businessUnits: [BusinessUnitInput]
  tags: [TagInput]
  statuses: [StatusInput]
  relatedEntities: [String]
}

type User {
  id: ID
  name: String
  email: String
  masterEntityID: String
  isLawyer: Boolean
  isAdmin: Boolean
  isActivated: Boolean
  checked: Boolean
  favourites: [String]
}

input PostUser {
  id: ID
  name: String
  email: String
  masterEntityID: String
  isLawyer: Boolean
  isAdmin: Boolean
  isActivated: Boolean
  checked: Boolean
}

input PostUserWithID {
  id: ID
  name: String
  email: String
  masterEntityID: String
  isLawyer: Boolean
  isAdmin: Boolean
  isActivated: Boolean
  favourites: [String]
}

input PostContract {
  internalParties: [String]
  externalParties: [String]
  executionDate: Date
  effectiveDate: Date
  expiryDate: Date
  rollingTerm: Boolean
  tags: [TagInput]
  businessUnit: BusinessUnitInput
  createdAt: Date
  lastUpdated: Date
  currentStatus: ContractStatusInput
  statuses: [ContractStatusInput]
  client: Boolean
  supplier: Boolean
  assignedTo: PostUserWithID  
}

input PostContractWithID {
  id: ID
  internalParties: [String]
  externalParties: [String]
  executionDate: Date
  effectiveDate: Date
  expiryDate: Date
  rollingTerm: Boolean
  tags: [TagInput]
  businessUnit: BusinessUnitInput
  createdAt: Date
  lastUpdated: Date
  currentStatus: ContractStatusInput
  statuses: [ContractStatusInput]
  client: Boolean
  supplier: Boolean
  assignedTo: PostUserWithID
}

scalar Date
type MyType {
   created: Date
}

type Contract {
  id: ID!
  masterEntityID: String
  internalParties: [String]
  externalParties: [String]
  executionDate: Date
  effectiveDate: Date
  expiryDate: Date
  rollingTerm: Boolean
  tags: [Tag]
  businessUnit: BusinessUnit
  createdAt: Date
  lastUpdated: Date
  currentStatus: ContractStatus
  statuses: [ContractStatus]
  client: Boolean
  supplier: Boolean
  assignedTo: User
  createdAt: Date
  updatedAt: Date
  favourite: Boolean
}

input ContractStatusInput {
  name: String
  date: Date
  color: String
}

type ContractStatus {
  name: String
  date: Date
  color: String
}

input StatusInput {
  name: String
  color: String
}

type Status {
  name: String
  color: String
  checked: Boolean
}

type Tag {
  name: String
  color: String
  checked: Boolean
}

input TagInput {
  name: String
  color: String
}

type BusinessUnit {
  name: String
  color: String
  checked: Boolean
}

input BusinessUnitInput {
  name: String
  color: String
}

schema {
  query: Query
  mutation: Mutation
 }
`
const schema = makeExecutableSchema({ typeDefs, resolvers })

export default schema

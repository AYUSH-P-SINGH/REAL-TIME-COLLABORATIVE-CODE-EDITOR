// Database Indexes Setup
// Add to your model files to improve query performance

const userIndexes = {
  // User Model Indexes
  email: { unique: true, sparse: true }, // Fast email lookups, ensures uniqueness
  createdAt: 1, // For sorting by creation date
  updatedAt: 1, // For sorting by update date
};

const projectIndexes = {
  // Project Model Indexes
  owner: 1, // Fast lookup by owner
  collaborators: 1, // Fast lookup in collaborators array
  createdAt: -1, // Sorted by creation (descending)
  'owner_createdAt': { owner: 1, createdAt: -1 }, // Compound index for user's projects
};

const fileIndexes = {
  // File Model Indexes
  projectId: 1, // Fast lookup by project
  createdAt: -1, // Sorted by creation (descending)
  'projectId_createdAt': { projectId: 1, createdAt: -1 }, // Compound for project files
  language: 1, // Filter by language
};

const auditLogIndexes = {
  // Audit Log Model Indexes
  userId: 1, // Fast lookup by user
  projectId: 1, // Fast lookup by project
  action: 1, // Filter by action type
  createdAt: -1, // Sorted by creation (descending)
  'userId_createdAt': { userId: 1, createdAt: -1 }, // Compound for user activity
};

const versionIndexes = {
  // Version Model Indexes
  fileId: 1, // Fast lookup by file
  versionNumber: -1, // Sort by version
  createdAt: -1, // Sort by creation
  'fileId_versionNumber': { fileId: 1, versionNumber: -1 }, // Compound for file versions
};

// To apply indexes in your models:
// schema.index({ fieldName: 1 });
// schema.index({ field1: 1, field2: -1 });

module.exports = {
  userIndexes,
  projectIndexes,
  fileIndexes,
  auditLogIndexes,
  versionIndexes,
};

# TODO: Enhance Symptom Checker App

## 1. Database Setup
- [x] Install MongoDB dependencies (mongoose)
- [ ] Create MongoDB Atlas account and get connection string
- [x] Create database connection file
- [x] Create Mongoose models: Symptom, Condition, User, AnalysisHistory

## 2. Authentication
- [x] Install auth dependencies (bcryptjs, jsonwebtoken)
- [x] Create auth middleware for JWT verification
- [x] Create user registration and login routes
- [ ] Update frontend with login/register forms

## 3. New Features
- [x] Add route to save analysis history per user
- [x] Add route to retrieve user's analysis history
- [x] Add admin routes to add/edit symptoms and conditions
- [x] Update analysis route to save results to history

## 4. Restructure for Netlify Functions
- [x] Convert Express routes to Netlify serverless functions
- [x] Create netlify/functions directory
- [x] Move logic to individual function files
- [x] Update package.json for Netlify deployment

## 5. Frontend Updates
- [x] Update API calls to use relative paths (/.netlify/functions/)
- [ ] Add user authentication UI
- [ ] Add history viewing feature
- [ ] Add admin panel for managing data

## 6. Deployment Configuration
- [x] Create netlify.toml file
- [x] Set up environment variables
- [ ] Test locally with Netlify CLI
- [ ] Deploy to Netlify

## 7. Testing and Finalization
- [ ] Test all features locally
- [ ] Ensure CORS and security
- [ ] Optimize for production
- [ ] Final deployment and verification

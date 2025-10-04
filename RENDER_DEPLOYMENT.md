# Deploying Fabric Management System to Render.com

This guide will walk you through deploying your Fabric Management System to Render.com.

## Prerequisites

1. A [Render.com](https://render.com) account
2. Your project code pushed to a GitHub repository

## Deployment Steps

### 1. Connect Your GitHub Repository

1. Log in to your Render account
2. Click on the "New" button and select "Blueprint"
3. Connect your GitHub account if you haven't already
4. Select the repository containing your Fabric Management System
5. Render will automatically detect the `render.yaml` file and configure your services

### 2. Configure Environment Variables

The `render.yaml` file already includes the following environment variables:

- `MONGO_URI`: Your MongoDB connection string
- `NODE_ENV`: Set to "production"
- `PORT`: Set to 10000 for the API service

If you need to add or modify any environment variables, you can do so in the Render dashboard after deployment.

### 3. Deploy Your Services

1. Click "Apply Blueprint" to start the deployment process
2. Render will create two services:
   - `fabric-management-api`: Your Node.js backend
   - `fabric-management-web`: Your React frontend
3. Wait for both services to build and deploy (this may take a few minutes)

### 4. Access Your Application

Once deployment is complete:

1. The frontend will be available at: `https://fabric-management-web.onrender.com`
2. The API will be available at: `https://fabric-management-api.onrender.com`

## Troubleshooting

If you encounter any issues during deployment:

1. **Build Failures**: Check the build logs in the Render dashboard for specific errors
2. **API Connection Issues**: Ensure the API URL in the frontend matches your Render API service URL
3. **Database Connection**: Verify your MongoDB connection string is correct and the database is accessible

## Updating Your Application

To update your application after making changes:

1. Push your changes to the GitHub repository
2. Render will automatically detect the changes and redeploy your services

## Monitoring

Render provides basic monitoring for your services:

1. View logs in the Render dashboard
2. Set up alerts for service outages
3. Monitor resource usage

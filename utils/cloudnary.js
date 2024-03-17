import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_KEY, 
  api_secret: process.env.CLOUD_API
});


const uploadOnCloudinary=async(localFilepath)=>{
    try {
        if(!localFilepath)
        {
            return null
        }
      const res=await  cloudinary.uploader.upload(localFilepath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log('file is uploaded on cloudinary',res.url);
        fs.unlinkSync(localFilepath);
        return res;
    } catch (error) {
        fs.unlinkSync(localFilepath)//remove the locally saved temprory file
        return null
        
    }
}
const DeletefromCloudinary=async(localFilepath)=>{
    try {
        if(!localFilepath)
        {
            return null
        }
      const res=await  cloudinary.uploader.destroy(localFilepath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log('File deleted successfully',res.url);
        fs.unlinkSync(localFilepath);
        return res;
    } catch (error) {
        fs.unlinkSync(localFilepath)//remove the locally saved temprory file
        return null
        
    }
}
  export {uploadOnCloudinary,DeletefromCloudinary};
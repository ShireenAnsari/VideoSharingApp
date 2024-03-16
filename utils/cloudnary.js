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
cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });
  export {uploadOnCloudinary};
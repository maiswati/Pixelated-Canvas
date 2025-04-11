import paintingModel from './../Models/painting.model.js';


export const fetchAllPaintingsForGallery = async(req,res)=>{
    try{
        const allpaintings = await paintingModel.find();
        return res.status(200).json({message: "All paintings are fetched successfully.", fetchedPaintings: allpaintings});
    }catch(error) {
        return res.status(500).json({message: "Internal Server Error"});
    }
}
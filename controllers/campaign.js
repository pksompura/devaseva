import fs from 'fs';
import path from 'path';
import sequelize from '../db/sequalize.js'; // Make sure to import sequelize instance
import DonationCampaign from '../models/donationCampaign.js';
import CampaignImage from '../models/donationCampaignImage.js';
import Subdonation from '../models/subdonation.js';
// Create a new donation campaign

export const getDonationCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the campaign by ID
    const campaign = await DonationCampaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({ status: false, message: 'Donation campaign not found', data: null });
    }

    // Fetch associated subdonations
    const subdonations = await Subdonation.findAll({ where: { campaign_id: id } });
    campaign.featured_image_base_url = `${req.protocol}://${req.get('host')}/${campaign.featured_image_base_url}`;
    res.status(200).json({
      status: true,
      message: 'Campaign fetched successfully',
      data: {
        campaign,
        subdonations,
      },
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};
const ensureDirectoryExists = (directoryPath) => {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  };
  
  // Function to save a base64 image to a file
  const saveBase64Image = (base64Image, campaignId, imageIndex) => {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
  
    const extension = matches[1].split('/')[1];
    const imageData = matches[2];
    const imagePath = `images/campaign_${campaignId}_${imageIndex}.${extension}`;
    const imageBuffer = Buffer.from(imageData, 'base64');
  
    ensureDirectoryExists(path.resolve('images'));
  
    fs.writeFileSync(path.resolve('images', `campaign_${campaignId}_${imageIndex}.${extension}`), imageBuffer);
  
    return imagePath;
  };

export const createDonationCampaign = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {  ...data } = req.body;

 const path=saveBase64Image(data?.featured_image_base_url,Math.floor(Math.random() * 5),Math.floor(Math.random() * 10))

 data.featured_image_base_url=path
 const campaign = await DonationCampaign.create(data, { transaction: t });
    // const imagePaths = images.map((image, index) => {
    //   const imagePath = saveBase64Image(image, campaign.id, index);
    //   return {
    //     imageUrl: imagePath,
    //     donationCampaignId: campaign.id,
    //   };
    // });

    // await CampaignImage.bulkCreate(imagePaths, { transaction: t });

    await t.commit();

    res.status(200).json({status:true,message:"campaign created succesfully",data:campaign});
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};

 


export const listDonationCampaigns = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1
  const perPage = parseInt(req.query.perPage) || 10;  

  try {
    const { count, rows } = await DonationCampaign.findAndCountAll({
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    const totalPages = Math.ceil(count / perPage);

    // Modify the featured_image_base_url to include the server URL
    const campaigns = rows.map(campaign => {
      return {
        ...campaign.dataValues,
        featured_image_base_url: `${req.protocol}://${req.get('host')}/${campaign.featured_image_base_url}`,
      };
    });

    res.status(200).json({
      campaigns: campaigns,
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Get a single donation campaign by ID
// export const getDonationCampaignById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const campaign = await DonationCampaign.findByPk(id);
//     if (!campaign) {
//       return res.status(404).json({ error: 'Donation campaign not found' });
//     }
//     res.status(200).json(campaign);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// Update a donation campaign
// export const updateDonationCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [updated] = await DonationCampaign.update(req.body, {
//       where: { id },
//     });
//     if (!updated) {
//       return res.status(404).json({ error: 'Donation campaign not found' });
//     }
//     const updatedCampaign = await DonationCampaign.findByPk(id);
//     res.status(200).json(updatedCampaign);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// Delete a donation campaign
export const deleteDonationCampaign = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const campaign = await DonationCampaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Donation campaign not found' });
    }
    
    // Check if the featured image exists and delete it
    const { featured_image_base_url } = campaign;
    
    if (featured_image_base_url && fs.existsSync(featured_image_base_url)) {
      fs.unlinkSync(featured_image_base_url);
      console.log(featured_image_base_url)
    }

    // Find and delete associated campaign images
    // const campaignImages = await CampaignImage.findAll({ where: { donationCampaignId: id } });
    // campaignImages.forEach(image => {
    //   deleteImage(image.imageUrl); // Delete each associated image
    // });

    await DonationCampaign.destroy({ where: { id }, transaction: t });
    // await CampaignImage.destroy({ where: { donationCampaignId: id }, transaction: t });

    await t.commit();
    res.status(200).json({status:true, message: 'Donation campaign deleted successfully' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};


export const updateDonationCampaign = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      //  images,
       featured_image_base_url, ...data } = req.body;
    const { id } = req.params;
console.log(id)
    const campaign = await DonationCampaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await campaign.update(data, { transaction: t });

    if (featured_image_base_url) {
      const oldImagePath = campaign.featured_image_base_url;
      const newImagePath = saveBase64Image(featured_image_base_url, id, 'featured');
      await campaign.update({ featured_image_base_url: newImagePath }, { transaction: t });

      if (oldImagePath) {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }// Delete old featured image
      }
    }

    // if (images && images.length > 0) {
    //   await CampaignImage.destroy({ where: { donationCampaignId: id }, transaction: t });
      
    //   const imagePaths = images.map((image, index) => {
    //     const imagePath = saveBase64Image(image, id, index);
    //     return {
    //       imageUrl: imagePath,
    //       donationCampaignId: id,
    //     };
    //   });

    //   await CampaignImage.bulkCreate(imagePaths, { transaction: t });
    // }

    await t.commit();
    res.status(200).json({status:true,message:"campaign updated succesfully",data:campaign});
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};
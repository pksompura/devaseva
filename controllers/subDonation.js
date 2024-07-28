import Subdonation from '../models/subdonation.js';
import DonationCampaign from '../models/donationCampaign.js';

import fs from "fs"
import path from "path"
import sequelize from '../db/sequalize.js';

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
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const createSubdonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, featured_image, amount, description, campaign_id } = req.body;

    const campaign = await DonationCampaign.findByPk(campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: 'Donation campaign not found' });
    }

    const path = saveBase64Image(featured_image, campaign_id, Math.floor(Math.random() * 10));

    const subdonation = await Subdonation.create({
      name,
      featured_image: path,
      amount,
      description,
      campaign_id,
    }, { transaction: t });

    await t.commit();
    res.status(201).json(subdonation);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};



export const updateSubdonation = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, featured_image, amount, description, campaign_id } = req.body;
  
      const subdonation = await Subdonation.findByPk(id);
      if (!subdonation) {
        return res.status(404).json({ error: 'Subdonation not found' });
      }
  
      const campaign = await DonationCampaign.findByPk(campaign_id);
      if (!campaign) {
        return res.status(404).json({ error: 'Donation campaign not found' });
      }
      const base64Regex = /^data:image\/[a-zA-Z]+;base64,/;
      if (featured_image&& base64Regex.test(featured_image)) {
      
        const newImagePath = saveBase64Image(featured_image, id, 'featured');

  
      

        subdonation.name = name;
        subdonation.featured_image = newImagePath;
        subdonation.amount = amount;
        subdonation.description = description;
        subdonation.campaign_slug = campaign.slug;
      }else{
        subdonation.name = name;
      subdonation.featured_image = featured_image;
      subdonation.amount = amount;
      subdonation.description = description;
      subdonation.campaign_slug = campaign.slug;
      }

     
  
      await subdonation.save();
      res.json(subdonation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
export const deleteSubdonation = async (req, res) => {
    try {
      const { id } = req.params;
  
      const subdonation = await Subdonation.findByPk(id);
      if (!subdonation) {
        return res.status(404).json({ error: 'Subdonation not found' });
      }
  
      await subdonation.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

  export const getSubdonationsByCampaign = async (req, res) => {
    try {
      const { campaign_id } = req.params;
  
      const campaign = await DonationCampaign.findByPk(campaign_id);
      if (!campaign) {
        return res.status(404).json({ error: 'Donation campaign not found' });
      }
  
      const subdonations = await Subdonation.findAll({
        where: { campaign_id: campaign.id },
      });
  
      res.json(subdonations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
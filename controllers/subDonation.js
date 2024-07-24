import Subdonation from '../models/subdonation.js';
import DonationCampaign from '../models/donationCampaign.js';

export const createSubdonation = async (req, res) => {
  try {
    const { name, featured_image, amount, description, campaign_id } = req.body;

    const campaign = await DonationCampaign.findByPk(campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: 'Donation campaign not found' });
    }

    const subdonation = await Subdonation.create({
      name,
      featured_image,
      amount,
      description,
      campaign_slug: campaign.slug
    });

    res.status(201).json(subdonation);
  } catch (error) {
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
  
      subdonation.name = name;
      subdonation.featured_image = featured_image;
      subdonation.amount = amount;
      subdonation.description = description;
      subdonation.campaign_slug = campaign.slug;
  
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
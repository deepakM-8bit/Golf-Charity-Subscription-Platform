import supabase from "../lib/supabase.js";
import {
  uploadCharityImage,
  deleteCharityImage,
} from "../utils/uploadService.js";
import {
  MIN_CHARITY_CONTRIBUTION,
  MAX_CHARITY_CONTRIBUTION,
} from "../config/constants.js";

// ── get all charities — public, with search + filter ──
export const getCharities = async (req, res) => {
  try {
    const { search, featured } = req.query;

    let query = supabase
      .from("charities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("name", `%${search}%`);
    if (featured === "true") query = query.eq("is_featured", true);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ charities: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch charities" });
  }
};

// ── get single charity — public ──
export const getCharity = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Charity not found" });

    res.json({ charity: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch charity" });
  }
};

// ── create charity — admin only ──
export const createCharity = async (req, res) => {
  try {
    const { name, description, website_url, is_featured, events } = req.body;

    if (!name)
      return res.status(400).json({ error: "Charity name is required" });

    let image_url = null;

    // handle image upload if file provided
    if (req.file) {
      image_url = await uploadCharityImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );
    }

    const { data, error } = await supabase
      .from("charities")
      .insert({
        name,
        description,
        image_url,
        website_url,
        is_featured: is_featured === "true" || is_featured === true,
        events: events ? JSON.parse(events) : [],
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ charity: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to create charity" });
  }
};

// ── update charity — admin only ──
export const updateCharity = async (req, res) => {
  try {
    const { name, description, website_url, is_featured, events } = req.body;

    // get existing charity for image cleanup
    const { data: existing } = await supabase
      .from("charities")
      .select("image_url")
      .eq("id", req.params.id)
      .single();

    let image_url = existing?.image_url;

    // handle new image upload
    if (req.file) {
      // delete old image from storage
      if (existing?.image_url) await deleteCharityImage(existing.image_url);

      image_url = await uploadCharityImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );
    }

    const { data, error } = await supabase
      .from("charities")
      .update({
        name,
        description,
        image_url,
        website_url,
        is_featured: is_featured === "true" || is_featured === true,
        events: events ? JSON.parse(events) : [],
        updated_at: new Date(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Charity not found" });

    res.json({ charity: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to update charity" });
  }
};

// ── delete charity — admin only ──
export const deleteCharity = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from("charities")
      .select("image_url")
      .eq("id", req.params.id)
      .single();

    // delete image from storage
    if (existing?.image_url) await deleteCharityImage(existing.image_url);

    const { error } = await supabase
      .from("charities")
      .delete()
      .eq("id", req.params.id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Charity deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete charity" });
  }
};

// ── get user charity selection ──
export const getUserCharity = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_charities")
      .select("*, charities(*)")
      .eq("user_id", req.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(400).json({ error: error.message });
    }

    res.json({ selection: data || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch charity selection" });
  }
};

// ── set or update user charity selection ──
// user selects charity at signup, min 10% contribution
export const setUserCharity = async (req, res) => {
  try {
    const { charity_id, contribution_percentage } = req.body;

    if (!charity_id)
      return res.status(400).json({ error: "charity_id is required" });

    const percentage =
      parseFloat(contribution_percentage) || MIN_CHARITY_CONTRIBUTION;

    if (
      percentage < MIN_CHARITY_CONTRIBUTION ||
      percentage > MAX_CHARITY_CONTRIBUTION
    ) {
      return res.status(400).json({
        error: `Contribution must be between ${MIN_CHARITY_CONTRIBUTION}% and ${MAX_CHARITY_CONTRIBUTION}%`,
      });
    }

    // verify charity exists
    const { data: charity } = await supabase
      .from("charities")
      .select("id")
      .eq("id", charity_id)
      .single();

    if (!charity) return res.status(404).json({ error: "Charity not found" });

    const { data, error } = await supabase
      .from("user_charities")
      .upsert(
        {
          user_id: req.user.id,
          charity_id,
          contribution_percentage: percentage,
          updated_at: new Date(),
        },
        { onConflict: "user_id" },
      )
      .select("*, charities(*)")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ selection: data, message: "Charity selection saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save charity selection" });
  }
};

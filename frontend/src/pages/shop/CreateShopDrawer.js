import { Box, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";
import DynamicDrawer from "../../UI/dynamicDrawer/DynamicDrawer";
import { useCreateShop } from "../../hooks/useShops";
import { addNotification } from "../../store/slices/uiSlice";

const CreateShopDrawer = ({ open, handleClose }) => {
  // Form input management state
  const [formData, setFormData] = useState({
    name: "",
    businessType: "Retail",
    location: "",
    address: "",
    phone: "",
  });
  const dispatch = useDispatch();
  const createShopMutation = useCreateShop();

  const [errors, setErrors] = useState({});

  const businessTypes = [
    { value: "retail", label: "Retail" },
    { value: "wholesale", label: "Wholesale" },
    { value: "both", label: "Both" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when user begins typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic form validation checks
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Shop Name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      await createShopMutation.mutateAsync(formData);
      dispatch(
        addNotification({
          message: "Shop created successfully",
          type: "success",
        }),
      );
      handleClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DynamicDrawer
      hasDrawerOpen={open}
      handleClose={handleClose}
      heading={"Create New Shop"}
      hasSecondaryHeader={"Add your shop information to get started."}
      buttonText={"Create"}
      submitClick={handleSubmit}
      customWidth='60vw'>
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <TextField
            size='small'
            required
            label='Shop Name'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
            variant='outlined'
            InputProps={{ sx: { borderRadius: 2 } }}
            sx={{ width: "20vw" }}
          />
          <TextField
            size='small'
            select
            sx={{ width: "15vw" }}
            label='Business Type'
            name='businessType'
            value={formData.businessType}
            onChange={handleInputChange}
            variant='outlined'
            InputProps={{ sx: { borderRadius: 2 } }}>
            {businessTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <TextField
          size='small'
          required
          fullWidth
          label='Location'
          name='location'
          placeholder='e.g. City Mall, Ground Floor'
          value={formData.location}
          onChange={handleInputChange}
          error={!!errors.location}
          helperText={errors.location}
          variant='outlined'
          InputProps={{ sx: { borderRadius: 2 } }}
        />

        <TextField
          size='small'
          fullWidth
          multiline
          rows={2}
          label='Address'
          name='address'
          placeholder='Full street address...'
          value={formData.address}
          onChange={handleInputChange}
          variant='outlined'
          InputProps={{ sx: { borderRadius: 2 } }}
        />

        <TextField
          size='small'
          sx={{ width: "20vw" }}
          label='Phone'
          name='phone'
          type='tel'
          value={formData.phone}
          onChange={handleInputChange}
          variant='outlined'
          InputProps={{ sx: { borderRadius: 2 } }}
        />
      </Box>
    </DynamicDrawer>
  );
};

export default CreateShopDrawer;

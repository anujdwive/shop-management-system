import { Box, Divider, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { useDispatch } from "react-redux";
import DynamicDrawer from "../../UI/dynamicDrawer/DynamicDrawer";
import { useCreateProduct } from "../../hooks/useProducts";
import { addNotification } from "../../store/slices/uiSlice";

const CreateProductDrawer = ({ open, handleClose }) => {
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    brand: "",
    sku: "",
    description: "",
    minStockLevel: "",
    price: "",
    costPrice: "",
    unit: "pcs",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const createProductMutation = useCreateProduct();

  const units = [
    { value: "pcs", label: "Pieces" },
    { value: "kg", label: "Kilogram" },
    { value: "litre", label: "Litre" },
    { value: "box", label: "Box" },
    { value: "packet", label: "Packet" },
    { value: "meter", label: "Meter" },
    { value: "dozen", label: "Dozen" },
  ];

  const statuses = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "discontinued", label: "Discontinued" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!productForm.name.trim()) {
      newErrors.name = "Product Name is required";
    }

    if (!productForm.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!productForm.price) {
      newErrors.price = "Selling Price is required";
    }

    if (!productForm.costPrice) {
      newErrors.costPrice = "Cost Price is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // API call yaha add karenge

    try {
      await createProductMutation.mutateAsync(productForm);
      dispatch(
        addNotification({
          message: "Product created successfully",
          type: "success",
        }),
      );
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <DynamicDrawer
      hasDrawerOpen={open}
      handleClose={handleClose}
      heading='Create New Product'
      hasSecondaryHeader='Add your product information to get started.'
      buttonText='Create'
      submitClick={handleSubmit}
      customWidth='60vw'>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
        {/* Basic Information */}
        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
          Basic Information
        </Typography>

        <Divider />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}>
          <TextField
            size='small'
            required
            label='Product Name'
            name='name'
            value={productForm.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "20vw" }}
          />

          <TextField
            size='small'
            required
            label='Category'
            name='category'
            value={productForm.category}
            onChange={handleInputChange}
            error={!!errors.category}
            helperText={errors.category}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "20vw" }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}>
          <TextField
            size='small'
            label='Brand'
            name='brand'
            value={productForm.brand}
            onChange={handleInputChange}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "20vw" }}
          />

          <TextField
            size='small'
            label='SKU'
            name='sku'
            value={productForm.sku}
            onChange={handleInputChange}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "20vw" }}
          />
        </Box>

        <TextField
          size='small'
          fullWidth
          multiline
          rows={2}
          label='Description'
          name='description'
          placeholder='Product description...'
          value={productForm.description}
          onChange={handleInputChange}
          variant='outlined'
          InputProps={{
            sx: { borderRadius: 2 },
          }}
        />

        {/* Pricing & Inventory */}
        <Typography
          variant='subtitle1'
          sx={{
            fontWeight: 600,
            mt: 1,
          }}>
          Pricing & Inventory
        </Typography>

        <Divider />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}>
          <TextField
            size='small'
            required
            type='number'
            label='Selling Price'
            name='price'
            value={productForm.price}
            onChange={handleInputChange}
            error={!!errors.price}
            helperText={errors.price}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "15vw" }}
          />

          <TextField
            size='small'
            required
            type='number'
            label='Cost Price'
            name='costPrice'
            value={productForm.costPrice}
            onChange={handleInputChange}
            error={!!errors.costPrice}
            helperText={errors.costPrice}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "15vw" }}
          />

          <TextField
            size='small'
            type='number'
            label='Min Stock Level'
            name='minStockLevel'
            value={productForm.minStockLevel}
            onChange={handleInputChange}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "15vw" }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}>
          <TextField
            size='small'
            select
            label='Unit'
            name='unit'
            value={productForm.unit}
            onChange={handleInputChange}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "15vw" }}>
            {units.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size='small'
            select
            label='Status'
            name='status'
            value={productForm.status}
            onChange={handleInputChange}
            variant='outlined'
            InputProps={{
              sx: { borderRadius: 2 },
            }}
            sx={{ width: "15vw" }}>
            {statuses.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>
    </DynamicDrawer>
  );
};

export default CreateProductDrawer;

import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DynamicDrawer from "../../../../../../UI/dynamicDrawer/DynamicDrawer";
import { useProductOptions } from "../../../../../../hooks/useProducts";
import { useShopOptions } from "../../../../../../hooks/useShops";
import { useAdjustStock } from "../../../../../../hooks/useStock";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../../../../store/slices/uiSlice";

const initialFormData = {
  shopId: "",
  productId: "",
  type: "in",
  quantity: "",
  notes: "",
};

const AdjustStockDrawer = ({ open, handleClose }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const { data: products } = useProductOptions();
  const { data: shops } = useShopOptions();
  console.log(products?.data, shops?.data);

  /*
   * Temporary data.
   *
   * Later these will come from:
   * useShops()
   * useProducts()
   */
  // const shops = [
  //   {
  //     _id: "shop1",
  //     name: "Main Shop",
  //   },
  //   {
  //     _id: "shop2",
  //     name: "Lucknow Shop",
  //   },
  // ];

  // const products = [
  //   {
  //     _id: "product1",
  //     name: "Laptop",
  //     sku: "LAP001",
  //   },
  //   {
  //     _id: "product2",
  //     name: "Keyboard",
  //     sku: "KEY001",
  //   },
  // ];

  const [currentStock, setCurrentStock] = useState(0);
  const adjustStockMutation = useAdjustStock();

  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setErrors({});
      setCurrentStock(0);
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleTypeChange = (event, newType) => {
    if (!newType) return;

    setFormData((prev) => ({
      ...prev,
      type: newType,
    }));

    setErrors((prev) => ({
      ...prev,
      type: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.shopId) {
      newErrors.shopId = "Please select a shop";
    }

    if (!formData.productId) {
      newErrors.productId = "Please select a product";
    }

    if (!formData.type) {
      newErrors.type = "Please select stock type";
    }

    if (!formData.quantity) {
      newErrors.quantity = "Please enter quantity";
    } else if (
      !Number.isInteger(Number(formData.quantity)) ||
      Number(formData.quantity) <= 0
    ) {
      newErrors.quantity = "Quantity must be a positive number";
    }

    if (formData.type === "out" && Number(formData.quantity) > currentStock) {
      newErrors.quantity = `Only ${currentStock} items available`;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      shopId: formData.shopId,
      productId: formData.productId,
      quantity: Number(formData.quantity),
      type: formData.type,
      notes: formData.notes.trim(),
    };

    try {
      await adjustStockMutation.mutateAsync(payload);
      dispatch(
        addNotification({
          message: "Stock adjust successfully",
          type: "success",
        }),
      );
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const selectedProduct = products?.data.find(
    (product) => product._id === formData.productId,
  );

  /*
   * Preview quantity
   */
  const adjustedQuantity =
    formData.type === "in"
      ? currentStock + Number(formData.quantity || 0)
      : currentStock - Number(formData.quantity || 0);

  return (
    <DynamicDrawer
      heading='Create new stock'
      hasSecondaryHeader='Add your stock information to get started.'
      hasDrawerOpen={open}
      handleClose={handleClose}
      buttonText='Adjust Stock'
      submitClick={handleSubmit}
      disableSubmit={!formData.shopId || !formData.productId}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          marginTop: 1,
        }}>
        {/* SHOP */}

        <FormControl fullWidth error={Boolean(errors.shopId)}>
          <InputLabel>Shop</InputLabel>

          <Select
            name='shopId'
            value={formData.shopId}
            label='Shop'
            onChange={handleChange}>
            {shops?.data.map((shop) => (
              <MenuItem key={shop._id} value={shop._id}>
                {shop.name}
              </MenuItem>
            ))}
          </Select>

          {errors.shopId && <FormHelperText>{errors.shopId}</FormHelperText>}
        </FormControl>

        {/* PRODUCT */}

        <FormControl fullWidth error={Boolean(errors.productId)}>
          <InputLabel>Product</InputLabel>

          <Select
            name='productId'
            value={formData.productId}
            label='Product'
            onChange={handleChange}>
            {products?.data.map((product) => (
              <MenuItem key={product._id} value={product._id}>
                <Box>
                  <Typography variant='body2'>{product.name}</Typography>

                  <Typography variant='caption' color='text.secondary'>
                    SKU: {product.sku}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>

          {errors.productId && (
            <FormHelperText>{errors.productId}</FormHelperText>
          )}
        </FormControl>

        {/* STOCK TYPE */}

        <Box>
          <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>
            Stock Type
          </Typography>

          <ToggleButtonGroup
            value={formData.type}
            exclusive
            onChange={handleTypeChange}
            fullWidth>
            <ToggleButton value='in'>Stock In</ToggleButton>

            <ToggleButton value='out'>Stock Out</ToggleButton>
          </ToggleButtonGroup>

          {errors.type && <FormHelperText error>{errors.type}</FormHelperText>}
        </Box>

        {/* QUANTITY */}

        <TextField
          fullWidth
          type='number'
          label='Quantity'
          name='quantity'
          value={formData.quantity}
          onChange={handleChange}
          error={Boolean(errors.quantity)}
          helperText={errors.quantity}
          inputProps={{
            min: 1,
          }}
        />

        {/* CURRENT STOCK */}

        {formData.productId && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
            }}>
            <Typography variant='body2' color='text.secondary'>
              Current Stock
            </Typography>

            <Typography variant='h6' fontWeight={700}>
              {currentStock}
            </Typography>

            {formData.quantity && (
              <Box sx={{ mt: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  After Adjustment
                </Typography>

                <Typography
                  variant='h6'
                  fontWeight={700}
                  color={adjustedQuantity < 0 ? "error.main" : "primary.main"}>
                  {adjustedQuantity}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* NOTES */}

        <TextField
          fullWidth
          multiline
          rows={3}
          label='Notes'
          name='notes'
          value={formData.notes}
          onChange={handleChange}
          placeholder='e.g. New stock received from supplier'
        />
      </Box>
    </DynamicDrawer>
  );
};

export default AdjustStockDrawer;

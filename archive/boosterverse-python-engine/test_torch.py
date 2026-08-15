import torch

# Create a random tensor
x = torch.rand(3, 3)
print("PyTorch is working! Here is a random tensor:")
print(x)

# Check if GPU is available (optional, PyTorch runs fine on CPU too)
print("Is GPU available?", torch.cuda.is_available())

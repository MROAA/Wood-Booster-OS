import torch
from brain import WoodBoosterBrain, get_brain_decision

print("🧪 Testataan Wood-Booster OS Neuroverkkoa...")

# 1. Testataan suoraa päätösfunktiota
sample_data = [0.1, 0.9, 0.4, 0.8]
result = get_brain_decision(sample_data)
print(f"📊 Syöte: {sample_data}")
print(f"🎯 Neuroverkon päätös (Softmax todennäköisyydet): {result}")

# 2. Testataan verkon alustusta ja tilojen ajoa
brain = WoodBoosterBrain()
x = torch.tensor([[1.0, 0.0, 1.0, 0.0]])
out = brain(x)
print(f"🧠 Suora verkon ajo onnistui, output: {out.tolist()}")

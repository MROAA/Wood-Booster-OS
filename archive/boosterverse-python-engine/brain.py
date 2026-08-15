import torch
import torch.nn as nn

class WoodBoosterBrain(nn.Module):
    """Edistynyt ja CPU-optimoitu neuroverkko Wood-Booster OS -älylle."""
    def __init__(self, input_dim=4, hidden_dim=32, output_dim=2):
        super(WoodBoosterBrain, self).__init__()
        self.layer1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.1)
        self.layer2 = nn.Linear(hidden_dim, hidden_dim)
        self.relu2 = nn.ReLU()
        self.layer3 = nn.Linear(hidden_dim, output_dim)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x, boost_mode=False):
        x = self.layer1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.layer2(x)
        x = self.relu2(x)
        x = self.layer3(x)
        
        # Jos CyberChimp-tila (boost) on päällä, vahvistetaan ulostulon painotuksia dynaamisesti
        if boost_mode:
            x = x * 1.5
            
        return self.softmax(x)

def get_brain_decision(data, boost_mode=False):
    """Käsittelee sisääntulevan datan neuroverkon läpi ja palauttaa päätöksen."""
    brain = WoodBoosterBrain()
    brain.eval()
    with torch.no_grad():
        tensor_data = torch.FloatTensor([data])
        output = brain(tensor_data, boost_mode=boost_mode)
        return output.tolist()[0]

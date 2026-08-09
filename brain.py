import math
import random


class WoodBoosterBrain:
    """Edistynyt ja CPU-optimoitu neuroverkko Wood-Booster OS -älylle.

    Puhdas Python/math-toteutus: verkko on aina ollut CPU-kokoinen
    lelu-MLP (4 syötettä, kouluttamaton), joten se ei koskaan
    tarvinnut GPU/CUDA-riippuvuutta (torch). Sama rajapinta säilyy.
    """

    def __init__(self, input_dim=4, hidden_dim=32, output_dim=2):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim
        self.w1 = [[random.uniform(-1, 1) for _ in range(input_dim)] for _ in range(hidden_dim)]
        self.b1 = [0.0] * hidden_dim
        self.w2 = [[random.uniform(-1, 1) for _ in range(hidden_dim)] for _ in range(hidden_dim)]
        self.b2 = [0.0] * hidden_dim
        self.w3 = [[random.uniform(-1, 1) for _ in range(hidden_dim)] for _ in range(output_dim)]
        self.b3 = [0.0] * output_dim
        self.dropout_p = 0.1

    def eval(self):
        return self

    @staticmethod
    def _linear(x, weights, biases):
        return [sum(w * xi for w, xi in zip(row, x)) + b for row, b in zip(weights, biases)]

    @staticmethod
    def _relu(x):
        return [max(0.0, v) for v in x]

    @staticmethod
    def _dropout(x, p, training):
        if not training or p <= 0:
            return x
        scale = 1.0 / (1.0 - p)
        return [0.0 if random.random() < p else v * scale for v in x]

    @staticmethod
    def _softmax(x):
        m = max(x)
        exps = [math.exp(v - m) for v in x]
        total = sum(exps)
        return [v / total for v in exps]

    def forward(self, x, boost_mode=False, training=False):
        h1 = self._relu(self._linear(x, self.w1, self.b1))
        h1 = self._dropout(h1, self.dropout_p, training)
        h2 = self._relu(self._linear(h1, self.w2, self.b2))
        out = self._linear(h2, self.w3, self.b3)

        # Jos CyberChimp-tila (boost) on päällä, vahvistetaan ulostulon painotuksia dynaamisesti
        if boost_mode:
            out = [v * 1.5 for v in out]

        return self._softmax(out)

    def __call__(self, x, boost_mode=False):
        return self.forward(x, boost_mode=boost_mode)


def get_brain_decision(data, boost_mode=False):
    """Käsittelee sisääntulevan datan neuroverkon läpi ja palauttaa päätöksen."""
    brain = WoodBoosterBrain()
    brain.eval()
    return brain.forward(data, boost_mode=boost_mode)

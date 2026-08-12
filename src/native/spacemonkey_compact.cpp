#include <vector>
#include <algorithm>

// Spacemonkey C++ Memory Compactor
extern "C" {
    // Poistaa vektorit, joiden normi (pituus) on alle kynnysarvon (merkityksetön data)
    int spacemonkey_compact_vectors(double** data, int size, double threshold) {
        int kept = 0;
        for (int i = 0; i < size; ++i) {
            double sumSq = 0.0;
            // Oletetaan vektorin koko 3:ksi tätä esimerkkiä varten
            for(int j = 0; j < 3; j++) sumSq += data[i][j] * data[i][j];
            
            if (sumSq > (threshold * threshold)) {
                data[kept++] = data[i];
            }
        }
        return kept; // Palauttaa jäljelle jääneiden määrän
    }
}

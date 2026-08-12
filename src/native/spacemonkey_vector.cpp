#include <iostream>
#include <vector>
#include <cmath>
#include <string>
#include <numeric>

// Spacemonkey C++ Native Vector & RAG Engine
class SpacemonkeyVectorEngine {
public:
    // Laskee kahden vektorin välisen pistetulon (dot product) / yhteensopivuuden RAG-hakua varten
    static double calculateCosineSimilarity(const std::vector<double>& v1, const std::vector<double>& v2) {
        if (v1.size() != v2.size() || v1.empty()) return 0.0;

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (size_t i = 0; i < v1.size(); ++i) {
            dotProduct += v1[i] * v2[i];
            normA += v1[i] * v1[i];
            normB += v2[i] * v2[i];
        }

        if (normA == 0.0 || normB == 0.0) return 0.0;
        return dotProduct / (std::sqrt(normA) * std::sqrt(normB));
    }

    void processNativeMemory(const std::string& queryContext) {
        std::cout << "[C++ NATIVE ENGINE] Spacemonkey käsittelee RAG-kontekstia natiivisti: " << queryContext << std::endl;
    }
};

extern "C" {
    SpacemonkeyVectorEngine* SpacemonkeyVectorEngine_new() { return new SpacemonkeyVectorEngine(); }
    double Spacemonkey_Similarity(double* a, double* b, int size) {
        std::vector<double> v1(a, a + size);
        std::vector<double> v2(b, b + size);
        return SpacemonkeyVectorEngine::calculateCosineSimilarity(v1, v2);
    }
}

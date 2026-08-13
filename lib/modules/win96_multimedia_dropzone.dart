import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96MultimediaDropzoneModule extends StatefulWidget {
  const Win96MultimediaDropzoneModule({super.key});

  @override
  State<Win96MultimediaDropzoneModule> createState() => _Win96MultimediaDropzoneModuleState();
}

class _Win96MultimediaDropzoneModuleState extends State<Win96MultimediaDropzoneModule> {
  bool _isDraggingOver = false;
  String _dropzoneStatus = 'Pudota videot, äänet, arkistot tai dokumentit tähän alueeseen.';
  
  final List<Map<String, String>> _ingestedFiles = [
    {'name': 'spacemonkey_theme.mp3', 'type': 'Ääni (Audio)', 'status': 'Indeksoitu & Valmis'},
    {'name': 'win96_core_architecture.mp4', 'type': 'Video', 'status': 'Purettu & Valmiina'},
    {'name': 'vector_knowledge_base.json', 'type': 'RAG Data', 'status': 'Muistiin lisätty'},
  ];

  void _simulateFileDrop(String fileName, String fileType) {
    setState(() {
      _dropzoneStatus = 'Käsitellään tiedostoa: $fileName ($fileType)...';
    });

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() {
          _dropzoneStatus = 'Tiedosto tuotu ja integroitu onnistuneesti!';
          _ingestedFiles.insert(0, {
            'name': fileName,
            'type': fileType,
            'status': 'Syötetty & Varmistettu'
          });
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '📂 Win96 Multimedia & Universal Drop-Zone',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Tuetut: Video, Audio, RAG, Arkistot',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _dropzoneStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        // Visuaalinen Drop-Zone alue
        GestureDetector(
          onTap: () => _simulateFileDrop('ambient_space_loop.flac', 'Ääni (Audio)'),
          child: Container(
            height: 90,
            width: double.infinity,
            decoration: BoxDecoration(
              color: _isDraggingOver ? const Color(0xFF2A2A2A) : const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: _isDraggingOver ? Colors.blue : Colors.white.withOpacity(0.3),
                style: BorderStyle.dashed,
                width: 2,
              ),
            ),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('📥 PUDOTA TIEDOSTOT TÄHÄN (DRAG & DROP)', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Tue MP4, MKV, MP3, WAV, ZIP, JSON, PDF, MD', style: TextStyle(color: Colors.grey, fontSize: 10)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView.builder(
              itemCount: _ingestedFiles.length,
              itemBuilder: (context, index) {
                final file = _ingestedFiles[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(file['name']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Tyyppi: ${file['type']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        file['status']!,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: () => _simulateFileDrop('neural_weights_backup.zip', 'Arkisto (Archive)'),
              child: const Text('Simuloi ZIP/Arkisto'),
            ),
            Button(
              onPressed: () => _simulateFileDrop('spacemonkey_vlog.mp4', 'Video'),
              child: const Text('Simuloi Video'),
            ),
          ],
        ),
      ],
    );
  }
}

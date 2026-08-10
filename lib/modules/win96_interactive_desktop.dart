import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96InteractiveDesktopModule extends StatefulWidget {
  const Win96InteractiveDesktopModule({super.key});

  @override
  State<Win96InteractiveDesktopModule> createState() => _Win96InteractiveDesktopModuleState();
}

class _Win96InteractiveDesktopModuleState extends State<Win96InteractiveDesktopModule> {
  bool _contextMenuVisible = false;
  Offset _menuPosition = const Offset(100, 100);
  String _desktopStatus = 'Interactive Desktop aktiivinen: Napsauta hiiren kakkospainikkeella avataksesi kontekstivalikon.';
  
  final List<Map<String, String>> _desktopFiles = [
    {'name': 'system_config.txt', 'type': 'Text Document', 'size': '1 KB'},
    {'name': 'spacemonkey_log.txt', 'type': 'Text Document', 'size': '4 KB'},
  ];

  void _showContextMenu(TapDownDetails details) {
    setState(() {
      _menuPosition = details.localPosition;
      _contextMenuVisible = true;
      _desktopStatus = 'Kontekstivalikko avattu koordinaateissa: ${_menuPosition.dx.toInt()}, ${_menuPosition.dy.toInt()}';
    });
  }

  void _hideContextMenu() {
    if (_contextMenuVisible) {
      setState(() {
        _contextMenuVisible = false;
      });
    }
  }

  void _createNewTextFile() {
    setState(() {
      final newFileName = 'Uusi_tekstitiedosto_${_desktopFiles.length + 1}.txt';
      _desktopFiles.add({
        'name': newFileName,
        'type': 'Text Document',
        'size': '0 KB',
      });
      _contextMenuVisible = false;
      _desktopStatus = 'Luotu uusi tekstitiedosto: $newFileName työpöydälle.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _hideContextMenu,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '🖱️ Win96 Interactive Desktop & Context Menu',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
              ),
              Text(
                'Tiedostoja työpöydällä: ${_desktopFiles.length}',
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
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Text(
              _desktopStatus,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF008080), // Klassinen Win96 Teal
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
              ),
              child: Stack(
                children: [
                  // Työpöydän interaktiivinen alue (kuuntelee hiiren kakkospainiketta /secondaryTap)
                  GestureDetector(
                    behavior: HitTestBehavior.translucent,
                    onSecondaryTapDown: _showContextMenu,
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Wrap(
                        spacing: 16,
                        runSpacing: 16,
                        children: _desktopFiles.map((file) {
                          return SizedBox(
                            width: 80,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('📄', style: TextStyle(fontSize: 28)),
                                const SizedBox(height: 4),
                                Text(
                                  file['name']!,
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),

                  // Win96 Kontekstivalikko (Context Menu)
                  if (_contextMenuVisible)
                    Positioned(
                      left: _menuPosition.dx.clamp(0.0, 300.0),
                      top: _menuPosition.dy.clamp(0.0, 200.0),
                      child: Container(
                        width: 160,
                        decoration: BoxDecoration(
                          color: const Color(0xFFC0C0C0),
                          border: Border(
                            top: BorderSide(color: Colors.white, width: 2),
                            left: BorderSide(color: Colors.white, width: 2),
                            right: BorderSide(color: Colors.black, width: 2),
                            bottom: BorderSide(color: Colors.black, width: 2),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.5),
                              blurRadius: 4,
                              offset: const Offset(2, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildContextMenuItem('Uusi kansio', () {
                              setState(() {
                                _contextMenuVisible = false;
                                _desktopStatus = 'Uusi kansio -toiminto kutsuttu.';
                              });
                            }),
                            _buildContextMenuItem('Uusi tekstitiedosto', _createNewTextFile),
                            Container(height: 1, color: Colors.grey),
                            _buildContextMenuItem('Järjestä kuvakkeet', () {
                              setState(() {
                                _contextMenuVisible = false;
                                _desktopStatus = 'Kuvakkeet järjestetty ruudukkoon.';
                              });
                            }),
                            _buildContextMenuItem('Ominaisuudet', () {
                              setState(() {
                                _contextMenuVisible = false;
                                _desktopStatus = 'Näytetään työpöydän ominaisuudet.';
                              });
                            }),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Button(
                onPressed: _createNewTextFile,
                child: const Text('Luo tekstitiedosto painikkeesta'),
              ),
              Button(
                onPressed: () {
                  setState(() {
                    _desktopFiles.clear();
                    _desktopStatus = 'Työpöytä tyhjennetty tiedostoista.';
                  });
                },
                child: const Text('Tyhjennä työpöytä'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContextMenuItem(String title, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Text(
          title,
          style: const TextStyle(color: Colors.black, fontSize: 10),
        ),
      ),
    );
  }
}

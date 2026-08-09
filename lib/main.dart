import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

void main() {
  runApp(const WoodBoosterOSApp());
}

class WoodBoosterOSApp extends StatelessWidget {
  const WoodBoosterOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return FluentApp(
      title: 'Wood-Booster OS',
      debugShowCheckedModeBanner: false,
      theme: FluentThemeData(
        accentColor: Colors.blue,
        brightness: Brightness.dark,
        visualDensity: VisualDensity.standard,
      ),
      home: const DesktopEnvironment(),
    );
  }
}

class DesktopEnvironment extends StatefulWidget {
  const DesktopEnvironment({super.key});

  @override
  State<DesktopEnvironment> createState() => _DesktopEnvironmentState();
}

class _DesktopEnvironmentState extends State<DesktopEnvironment> {
  bool _isStartMenuOpen = false;
  String _activeApp = 'Dashboard';

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: MediaQuery(
        data: MediaQueryData(size: MediaQuery.of(context).size),
        child: Container(
          color: const Color(0xFF1E1E1E),
          child: Stack(
            children: [
              // 1. Työpöydän tausta ja vesileimana oleva Fisherman-logo
              Positioned.fill(
                child: Stack(
                  children: [
                    Center(
                      child: Opacity(
                        opacity: 0.08,
                        child: Image.asset(
                          'assets/fisherman.png',
                          width: 450,
                          height: 450,
                        ),
                      ),
                    ),
                    // Työpöydän ikonit vasemmassa yläkulmassa
                    Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Wrap(
                        spacing: 24,
                        runSpacing: 24,
                        children: [
                          _buildDesktopIcon('Spacemonkey', FluentIcons.robot, () {
                            setState(() => _activeApp = 'Spacemonkey');
                          }),
                          _buildDesktopIcon('System Pulse', FluentIcons.pulse, () {
                            setState(() => _activeApp = 'System Pulse');
                          }),
                          _buildDesktopIcon('Wood Explorer', FluentIcons.folder, () {
                            setState(() => _activeApp = 'Explorer');
                          }),
                          _buildDesktopIcon('Muistio', FluentIcons.edit, () {
                            setState(() => _activeApp = 'Muistio');
                          }),
                          _buildDesktopIcon('Asetukset', FluentIcons.settings, () {
                            setState(() => _activeApp = 'Settings');
                          }),
                        ],
                      ),
                    ),
                    // Aktiivinen ikkuna työpöydän päällä
                    Center(
                      child: _buildActiveAppContent(),
                    ),
                  ],
                ),
              ),

              // 2. Start-valikko (Ponnistaa keskiyläpuolelle tehtäväpalkkia)
              if (_isStartMenuOpen)
                Positioned(
                  bottom: 64,
                  left: MediaQuery.of(context).size.width / 2 - 175,
                  child: Container(
                    width: 350,
                    height: 400,
                    decoration: BoxDecoration(
                      color: const Color(0xFF252525),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.6),
                          blurRadius: 25,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Wood Start',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 16),
                          const Text('Pinned Apps', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          const SizedBox(height: 10),
                          Expanded(
                            child: ListView(
                              children: [
                                _buildStartMenuItem('Spacemonkey AI', FluentIcons.robot, () {
                                  setState(() {
                                    _activeApp = 'Spacemonkey';
                                    _isStartMenuOpen = false;
                                  });
                                }),
                                _buildStartMenuItem('System Pulse', FluentIcons.pulse, () {
                                  setState(() {
                                    _activeApp = 'System Pulse';
                                    _isStartMenuOpen = false;
                                  });
                                }),
                                _buildStartMenuItem('Wood Explorer', FluentIcons.folder, () {
                                  setState(() {
                                    _activeApp = 'Explorer';
                                    _isStartMenuOpen = false;
                                  });
                                }),
                                _buildStartMenuItem('Muistio', FluentIcons.edit, () {
                                  setState(() {
                                    _activeApp = 'Muistio';
                                    _isStartMenuOpen = false;
                                  });
                                }),
                                _buildStartMenuItem('Asetukset', FluentIcons.settings, () {
                                  setState(() {
                                    _activeApp = 'Settings';
                                    _isStartMenuOpen = false;
                                  });
                                }),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // 3. Windows 11 -tyylinen Taskbar alareunassa keskellä
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  height: 52,
                  color: const Color(0xFF181818).withOpacity(0.95),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        icon: Image.asset('assets/fisherman.png', width: 24, height: 24),
                        onPressed: () {
                          setState(() {
                            _isStartMenuOpen = !_isStartMenuOpen;
                          });
                        },
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(FluentIcons.search, size: 20, color: Colors.white),
                        onPressed: () {},
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(FluentIcons.folder, size: 20, color: Colors.white),
                        onPressed: () => setState(() => _activeApp = 'Explorer'),
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(FluentIcons.robot, size: 20, color: Colors.white),
                        onPressed: () => setState(() => _activeApp = 'Spacemonkey'),
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(FluentIcons.pulse, size: 20, color: Colors.white),
                        onPressed: () => setState(() => _activeApp = 'System Pulse'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDesktopIcon(String title, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onDoubleTap: onTap,
      child: Container(
        width: 80,
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 36, color: Colors.blue),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStartMenuItem(String title, IconData icon, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Button(
        onPressed: onTap,
        child: Row(
          children: [
            Icon(icon, size: 20, color: Colors.blue),
            const SizedBox(width: 12),
            Text(title, style: const TextStyle(fontSize: 14, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveAppContent() {
    if (_activeApp == 'Dashboard') return const SizedBox.shrink();

    return Container(
      width: 600,
      height: 400,
      decoration: BoxDecoration(
        color: const Color(0xFF2C2C2C),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(color: Colors.black54, blurRadius: 15, offset: const Offset(0, 5))
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.white10)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Text('Wood-Booster OS // $_activeApp', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                IconButton(
                  icon: const Icon(FluentIcons.chrome_close, size: 14, color: Colors.white),
                  onPressed: () => setState(() => _activeApp = 'Dashboard'),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: _getAppBody(_activeApp),
            ),
          ),
        ],
      ),
    );
  }

  Widget _getAppBody(String appName) {
    switch (appName) {
      case 'Spacemonkey':
        return const Center(child: Text('🪐 Spacemonkey AI Operator on valmiina komentoihin.', style: TextStyle(color: Colors.white)));
      case 'System Pulse':
        return const Center(child: Text('🛡 System Pulse: Kaikki ydinjärjestelmät stabiileja.', style: TextStyle(color: Colors.white)));
      case 'Explorer':
        return const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('📁 Wood Explorer / Home', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            SizedBox(height: 10),
            Text('├── Projects\n├── Knowledge\n├── Memory\n├── Backups\n└── Modules', style: TextStyle(color: Colors.white70)),
          ],
        );
      case 'Muistio':
        return const TextBox(
          maxLines: null,
          expands: true,
          placeholder: 'Kirjoita muistiinpanoja...',
        );
      case 'Settings':
        return const Center(child: Text('⚙ Wood-Booster OS Asetukset ja teemojen hallinta.', style: TextStyle(color: Colors.white)));
      default:
        return const Text('Tuntematon sovellus', style: TextStyle(color: Colors.white));
    }
  }
}
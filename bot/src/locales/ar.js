module.exports = {
  // General
  ERROR: "❌ حدث خطأ أثناء تنفيذ هذا الأمر.",
  NO_PERMISSION: "🚫 ليس لديك صلاحية لاستخدام هذا الأمر.",
  SUCCESS: "✅ تمت العملية بنجاح!",

  // Commands
  PING_DESCRIPTION: "فحص سرعة استجابة البوت",
  PING_RESPONSE:
    "🏓 بونج! زمن الاستجابة **{latency}ms**\n⏱️ زمن API: **{api}ms**",

  HELP_DESCRIPTION: "عرض قائمة الأوامر المتاحة",
  HELP_TITLE: "📚 أوامر Vantyx",
  HELP_DESCRIPTION_TEXT: "هنا جميع الأوامر المتاحة",
  HELP_CATEGORY_MODERATION: "🛡️ الإشراف",
  HELP_CATEGORY_LEVELING: "📊 نظام المستويات",
  HELP_CATEGORY_GIVEAWAY: "🎉 المسابقات",
  HELP_CATEGORY_UTILITY: "🔧 الأدوات",

  LANGUAGE_DESCRIPTION: "تغيير لغة البوت",
  LANGUAGE_CHANGED: "🌐 تم تغيير اللغة إلى **العربية**!",
  LANGUAGE_SELECT: "🌍 الرجاء اختيار اللغة:",

  BOTINFO_DESCRIPTION: "عرض معلومات البوت والإحصائيات",
  BOTINFO_TITLE: "🤖 معلومات البوت",
  BOTINFO_NAME: "اسم البوت",
  BOTINFO_ID: "معرف البوت",
  BOTINFO_CREATED: "تاريخ الإنشاء",
  BOTINFO_UPTIME: "وقت التشغيل",
  BOTINFO_SERVERS: "السيرفرات",
  BOTINFO_USERS: "المستخدمون",
  BOTINFO_MEMORY: "استخدام الذاكرة",
  BOTINFO_NODE: "إصدار Node.js",
  BOTINFO_DISCORDJS: "إصدار Discord.js",
  BOTINFO_PING: "البينج",

  // Moderation Commands
  BAN_DESCRIPTION: "حظر عضو من السيرفر",
  BAN_TITLE: "🔨 تم حظر العضو",
  BAN_SUCCESS: "تم حظر **{user}** من السيرفر",
  BAN_USER: "👤 **المستخدم**",
  BAN_REASON: "📝 **السبب**",
  BAN_MODERATOR: "👮 **المشرف**",
  BAN_NO_REASON: "لم يتم تقديم سبب",
  BAN_CANNOT: "❌ لا يمكنني حظر هذا المستخدم. قد يكون لديه صلاحيات أعلى مني.",
  BAN_SELF: "❌ لا يمكنك حظر نفسك!",
  BAN_BOT: "❌ لا يمكنني حظر نفسي!",

  KICK_DESCRIPTION: "طرد عضو من السيرفر",
  KICK_TITLE: "👢 تم طرد العضو",
  KICK_SUCCESS: "تم طرد **{user}** من السيرفر",
  KICK_USER: "👤 **المستخدم**",
  KICK_REASON: "📝 **السبب**",
  KICK_MODERATOR: "👮 **المشرف**",
  KICK_NO_REASON: "لم يتم تقديم سبب",
  KICK_CANNOT: "❌ لا يمكنني طرد هذا المستخدم. قد يكون لديه صلاحيات أعلى مني.",
  KICK_SELF: "❌ لا يمكنك طرد نفسك!",
  KICK_BOT: "❌ لا يمكنني طرد نفسي!",

  TIMEOUT_DESCRIPTION: "كتم عضو مؤقتاً",
  TIMEOUT_TITLE: "⏱️ تم كتم العضو",
  TIMEOUT_SUCCESS: "تم كتم **{user}** مؤقتاً",
  TIMEOUT_USER: "👤 **المستخدم**",
  TIMEOUT_DURATION: "⏰ **المدة**",
  TIMEOUT_REASON: "📝 **السبب**",
  TIMEOUT_MODERATOR: "👮 **المشرف**",
  TIMEOUT_NO_REASON: "لم يتم تقديم سبب",
  TIMEOUT_CANNOT:
    "❌ لا يمكنني كتم هذا المستخدم. قد يكون لديه صلاحيات أعلى مني.",
  TIMEOUT_SELF: "❌ لا يمكنك كتم نفسك!",
  TIMEOUT_BOT: "❌ لا يمكنني كتم نفسي!",

  WARN_DESCRIPTION: "تحذير عضو",
  WARN_TITLE: "⚠️ تم إصدار تحذير",
  WARN_SUCCESS: "تم تحذير **{user}**",
  WARN_USER: "👤 **المستخدم**",
  WARN_REASON: "📝 **السبب**",
  WARN_MODERATOR: "👮 **المشرف**",
  WARN_TOTAL: "📊 **إجمالي التحذيرات**",
  WARN_COUNT: "{count} تحذير(ات)",

  WARNS_DESCRIPTION: "عرض تحذيرات عضو",
  WARNS_TITLE: "📋 تحذيرات {user}",
  WARNS_NONE: "✅ هذا المستخدم ليس لديه تحذيرات.",
  WARNS_LIST: "**التحذير رقم #{number}**",
  WARNS_BY: "👮 بواسطة",
  WARNS_REASON: "📝 السبب",
  WARNS_DATE: "📅 التاريخ",

  REMOVEWARN_DESCRIPTION: "إزالة تحذير من عضو",
  REMOVEWARN_TITLE: "✅ تم إزالة التحذير",
  REMOVEWARN_SUCCESS: "تم إزالة التحذير **#{id}** من **{user}**",
  REMOVEWARN_USER: "👤 **المستخدم**",
  REMOVEWARN_ID: "🔢 **رقم التحذير**",
  REMOVEWARN_NOT_FOUND: "❌ التحذير غير موجود.",

  CLEAR_DESCRIPTION: "حذف عدة رسائل",
  CLEAR_TITLE: "🧹 تم مسح الرسائل",
  CLEAR_SUCCESS: "تم حذف **{amount}** رسالة بنجاح",
  CLEAR_AMOUNT: "📊 **العدد**",
  CLEAR_MESSAGES: "{count} رسالة",

  // Leveling Commands
  RANK_DESCRIPTION: "عرض رتبتك أو رتبة عضو آخر",
  RANK_TITLE: "📊 بطاقة الرتبة",
  RANK_LEVEL: "🎯 **المستوى**",
  RANK_XP: "⭐ **نقاط الخبرة**",
  RANK_RANK: "🏆 **الترتيب**",
  RANK_NEXT_LEVEL: "📈 **المستوى التالي**",
  RANK_PROGRESS: "التقدم",
  RANK_NO_DATA: "❌ لا توجد بيانات ترتيب لهذا المستخدم.",

  LEADERBOARD_DESCRIPTION: "عرض لوحة المتصدرين",
  LEADERBOARD_TITLE: "🏆 لوحة المتصدرين",
  LEADERBOARD_TOP: "أفضل 10 أعضاء",
  LEADERBOARD_LEVEL: "المستوى",
  LEADERBOARD_XP: "نقاط الخبرة",
  LEADERBOARD_NO_DATA: "❌ لا توجد بيانات للوحة المتصدرين.",
  LEADERBOARD_POSITION: "#{position}",

  LEVEL_UP: "🎉 مبروك **{user}**! لقد وصلت إلى **المستوى {level}**! 🎊",

  // Giveaway Commands
  GIVEAWAY_START_DESCRIPTION: "بدء مسابقة",
  GIVEAWAY_START_TITLE: "🎉 بدأت المسابقة!",
  GIVEAWAY_START_SUCCESS: "تم إنشاء المسابقة بنجاح!",
  GIVEAWAY_PRIZE: "🎁 **الجائزة**",
  GIVEAWAY_DURATION: "⏰ **المدة**",
  GIVEAWAY_WINNERS: "👥 **الفائزون**",
  GIVEAWAY_HOSTED_BY: "👤 **استضافة بواسطة**",
  GIVEAWAY_REACT: "تفاعل بـ 🎉 للدخول!",
  GIVEAWAY_ENDS_AT: "⏰ تنتهي",
  GIVEAWAY_ENDED: "🎊 **انتهت**",

  GIVEAWAY_END_DESCRIPTION: "إنهاء مسابقة مبكراً",
  GIVEAWAY_END_TITLE: "🎊 انتهت المسابقة!",
  GIVEAWAY_END_SUCCESS: "تم إنهاء المسابقة",
  GIVEAWAY_WINNERS_TITLE: "🏆 **الفائزون**",
  GIVEAWAY_NO_WINNERS: "لا يوجد مشاركون صالحون",

  GIVEAWAY_REROLL_DESCRIPTION: "إعادة اختيار فائز المسابقة",
  GIVEAWAY_REROLL_TITLE: "🔄 إعادة اختيار الفائز!",
  GIVEAWAY_NEW_WINNER: "🎉 **الفائز الجديد**",

  // Utility
  USERINFO_DESCRIPTION: "الحصول على معلومات عن مستخدم",
  USERINFO_TITLE: "👤 معلومات المستخدم",
  USERINFO_MEMBER: "معلومات العضو",
  USERINFO_USER: "معلومات الحساب",
  USERINFO_USERNAME: "اسم المستخدم",
  USERINFO_ID: "المعرف",
  USERINFO_CREATED: "تاريخ الإنشاء",
  USERINFO_JOINED: "تاريخ الانضمام",
  USERINFO_ROLES: "الرتب",
  USERINFO_BOT: "بوت",
  USERINFO_YES: "نعم",
  USERINFO_NO: "لا",

  AVATAR_DESCRIPTION: "عرض صورة المستخدم",
  AVATAR_TITLE: "🖼️ صورة {user}",
  AVATAR_LINK: "الرابط",

  SERVERINFO_DESCRIPTION: "الحصول على معلومات عن السيرفر",
  SERVERINFO_TITLE: "🏰 معلومات السيرفر",
  SERVERINFO_OWNER: "👑 المالك",
  SERVERINFO_CREATED: "📅 تاريخ الإنشاء",
  SERVERINFO_MEMBERS: "👥 الأعضاء",
  SERVERINFO_CHANNELS: "💬 القنوات",
  SERVERINFO_ROLES: "🎭 الرتب",
  SERVERINFO_BOOSTS: "🚀 التعزيزات",
  SERVERINFO_ID: "🆔 المعرف",

  ROLES_DESCRIPTION: "عرض قائمة رتب السيرفر",
  ROLES_TITLE: "🎭 رتب السيرفر",
  ROLES_COUNT: "إجمالي الرتب: {count}",
  ROLES_LIST: "قائمة الرتب",

  // Moderation - Mute/Unmute/Untimeout
  MUTE_DESCRIPTION: "كتم عضو",
  MUTE_TEXT_DESCRIPTION: "كتم عضو في القنوات الكتابية (Timeout)",
  MUTE_VOICE_DESCRIPTION: "كتم عضو في القنوات الصوتية",
  MUTE_TITLE: "🔇 تم كتم العضو",
  MUTE_SUCCESS_TEXT: "تم كتم **{user}** في القنوات الكتابية",
  MUTE_SUCCESS_VOICE: "تم كتم **{user}** في القنوات الصوتية",
  MUTE_ALREADY_VOICE: "❌ هذا المستخدم مكتوم صوتياً بالفعل.",
  MUTE_NOT_IN_VOICE: "❌ هذا المستخدم ليس في قناة صوتية.",

  UNMUTE_DESCRIPTION: "إلغاء كتم عضو",
  UNMUTE_TEXT_DESCRIPTION: "إلغاء كتم عضو في القنوات الكتابية",
  UNMUTE_VOICE_DESCRIPTION: "إلغاء كتم عضو في القنوات الصوتية",
  UNMUTE_TITLE: "🔊 تم إلغاء الكتم",
  UNMUTE_SUCCESS_TEXT: "تم إلغاء كتم **{user}** في القنوات الكتابية",
  UNMUTE_SUCCESS_VOICE: "تم إلغاء كتم **{user}** في القنوات الصوتية",
  UNMUTE_NOT_VOICE: "❌ هذا المستخدم ليس مكتوم صوتياً.",

  UNTIMEOUT_DESCRIPTION: "إزالة التايم أوت من عضو",
  UNTIMEOUT_TITLE: "🔊 تم إزالة التايم أوت",
  UNTIMEOUT_SUCCESS: "تم إزالة التايم أوت من **{user}**",
  UNTIMEOUT_NOT_TIMED_OUT: "❌ هذا المستخدم ليس لديه تايم أوت.",

  // Moderation - Role
  ROLE_DESCRIPTION: "إدارة رتب المستخدم",
  ROLE_ADD_DESCRIPTION: "إضافة رتبة لمستخدم",
  ROLE_REMOVE_DESCRIPTION: "إزالة رتبة من مستخدم",
  ROLE_TITLE_ADD: "✅ تم إضافة الرتبة",
  ROLE_TITLE_REMOVE: "🗑️ تم إزالة الرتبة",
  ROLE_SUCCESS_ADD: "تم إضافة رتبة **{role}** إلى **{user}**",
  ROLE_SUCCESS_REMOVE: "تم إزالة رتبة **{role}** من **{user}**",
  ROLE_ALREADY_HAS: "❌ المستخدم لديه هذه الرتبة بالفعل.",
  ROLE_DOES_NOT_HAVE: "❌ المستخدم ليس لديه هذه الرتبة.",
  ROLE_HIGHER: "❌ لا يمكنني إدارة هذه الرتبة لأنها أعلى من رتبتي.",

  // Moderation - Lock/Unlock
  LOCK_DESCRIPTION: "قفل قناة",
  LOCK_TITLE: "🔒 تم قفل القناة",
  LOCK_SUCCESS: "تم قفل القناة لـ @everyone",
  LOCK_ALREADY: "❌ هذه القناة مقفلة بالفعل.",

  UNLOCK_DESCRIPTION: "فتح قناة",
  UNLOCK_TITLE: "🔓 تم فتح القناة",
  UNLOCK_SUCCESS: "تم فتح القناة لـ @everyone",
  UNLOCK_ALREADY: "❌ هذه القناة مفتوحة بالفعل.",

  // Moderation - Slowmode
  SLOWMODE_DESCRIPTION: "تعيين الوضع البطيء للقناة",
  SLOWMODE_TITLE: "🐢 تم تحديث الوضع البطيء",
  SLOWMODE_SUCCESS: "تم تعيين الوضع البطيء إلى **{time}** ثانية",
  SLOWMODE_OFF: "تم إيقاف الوضع البطيء",
};

import React, { useState, useEffect, useRef } from "react";
import echo from "../utils/echo";
import { getDiskusi, sendDiskusi, deleteDiskusi, getCurrentUser } from "../services/authService";
import { toast } from "../utils/notify";

export default function DiskusiMapel({ mapelId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  
  // State for Long Press Delete
  const [showDeleteMenuId, setShowDeleteMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const pressTimerRef = useRef(null);

  // Fallback if currentUser is not passed completely, try to fetch it
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        try {
          const res = await getCurrentUser();
          setUser(res.data?.data || res.data);
        } catch (err) {
          console.error("Failed to fetch user", err);
        }
      }
    };
    fetchUser();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await getDiskusi(mapelId);
      const data = res.data?.data || res.data || [];
      setMessages(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
      setError("Gagal memuat diskusi. Pastikan backend sudah siap.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapelId) return;

    fetchMessages();

    // ── Subscribe ke private channel ─────────────────────────────────
    console.log(`[Echo] Subscribe ke channel: diskusi.${mapelId}`);
    const channel = echo.private(`diskusi.${mapelId}`);

    // bind_global ref untuk cleanup
    let boundGlobalHandler = null;

    channel.subscribed(() => {
      console.log(`[Echo] Berhasil subscribe ke channel: diskusi.${mapelId}`);

    });

    channel.error((error) => {
      console.error(`[Echo] Gagal subscribe:`, error);
    });

    // ── Handler pesan baru ────────────────────────────────────────────
    channel.listen(".message.sent", (e) => {
      console.log("[Echo] Menerima event .message.sent:", e);
      if (e.diskusi) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === e.diskusi.id);
          if (exists) return prev;
          return [...prev, e.diskusi];
        });
      }
    });

    // ── Handler hapus pesan (Fail-proof Global Listener) ──────────────
    const handleGlobalEvent = (eventName, data) => {
      // Hanya proses event yang berhubungan dengan "deleted"
      const isDeleteEvent =
        eventName.toLowerCase().includes("deleted") ||
        eventName.toLowerCase().includes("messagedeleted");

      if (!isDeleteEvent) return;

      console.log(`[Pusher] Event hapus terdeteksi: "${eventName}"`, data);

      const payload = typeof data === "string" ? JSON.parse(data) : data;
      
      // Ambil ID dari berbagai kemungkinan nama variabel yang dikirim backend
      const deletedId =
        payload.id ||
        payload.pesan_id ||
        payload.diskusi_id ||
        payload.message_id ||
        (payload.diskusi && payload.diskusi.id) ||
        (payload.pesan && payload.pesan.id);

      if (deletedId) {
        console.log(`[Pusher] Menghapus pesan id=${deletedId}`);
        setMessages((prev) =>
          prev.filter((m) => String(m.id) !== String(deletedId))
        );
      }
    };

    // Pasang listener global di root Pusher agar menangkap event apapun
    if (echo.connector && echo.connector.pusher) {
      echo.connector.pusher.bind_global(handleGlobalEvent);
    }

    // Fallback normal listen
    const deleteHandler = (e) => {
      const deletedId = e.id || e.pesan_id || e.diskusi_id || e.message_id || (e.diskusi && e.diskusi.id);
      if (deletedId) {
        setMessages((prev) => prev.filter((m) => String(m.id) !== String(deletedId)));
      }
    };
    channel.listen(".message.deleted", deleteHandler);
    channel.listen(".MessageDeleted", deleteHandler);
    channel.listen("MessageDeleted", deleteHandler);
    channel.listen("message.deleted", deleteHandler);

    return () => {
      console.log(`[Echo] Unsubscribe dari channel: diskusi.${mapelId}`);
      if (echo.connector && echo.connector.pusher) {
        echo.connector.pusher.unbind_global(handleGlobalEvent);
      }
      channel.stopListening(".message.sent");
      channel.stopListening(".message.deleted");
      channel.stopListening(".MessageDeleted");
      channel.stopListening("message.deleted");
      channel.stopListening("MessageDeleted");
      echo.leaveChannel(`diskusi.${mapelId}`);
    };
  }, [mapelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    // Optimistic UI update (optional, but good for UX)
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      pesan: newMessage,
      created_at: new Date().toISOString(),
      nama_pengirim: user?.nama || "Saya",
      role: user?.role || "Siswa",
      user_id: user?.id,
      is_optimistic: true
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const res = await sendDiskusi(mapelId, tempMessage.pesan);
      const savedMessage = res.data?.data || res.data;
      // Replace tempMessage, and remove any duplicate that may have come in via broadcast
      setMessages((prev) => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        // If broadcast already added the saved message, don't add it again
        const alreadyExists = withoutTemp.find(m => m.id === savedMessage?.id);
        if (alreadyExists) return withoutTemp;
        return [...withoutTemp, savedMessage];
      });
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      toast("Gagal mengirim pesan.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleTouchStart = (msgId, isMe, isGuru) => {
    // Hanya izinkan jika itu pesannya sendiri atau dia adalah guru
    if (!isMe && !isGuru) return;
    
    // Tutup menu lain jika ada
    setShowDeleteMenuId(null);
    
    pressTimerRef.current = setTimeout(() => {
      setShowDeleteMenuId(msgId);
      // Memicu getaran di HP jika didukung (50ms)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 1000); // 1 detik long press
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      setDeletingId(msgId);
      await deleteDiskusi(msgId);
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(msgId)));
      toast("Pesan berhasil dihapus", "success");
    } catch (err) {
      console.error("Gagal menghapus pesan:", err);
      toast("Gagal menghapus pesan", "error");
    } finally {
      setDeletingId(null);
      setShowDeleteMenuId(null);
    }
  };

  // Tutup popup delete saat klik di luar area pesan
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDeleteMenuId && !e.target.closest(".message-bubble-container")) {
        setShowDeleteMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showDeleteMenuId]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm shadow-inner">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Ruang Diskusi</h2>
            <p className="text-blue-100 text-xs font-medium">Real-time chat</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-center">
             <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl border border-rose-100 max-w-sm">
                <svg className="h-8 w-8 mx-auto mb-2 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <p className="text-sm font-semibold">{error}</p>
             </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
               <svg className="h-10 w-10 text-blue-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
               </svg>
            </div>
            <p className="font-medium text-slate-500">Belum ada pesan</p>
            <p className="text-sm mt-1">Mulai diskusi sekarang!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user_id === user?.id || msg.is_optimistic;
            const senderName = msg.nama_pengirim || "Pengguna";
            const role = msg.role || "Siswa";
            const isGuru = role.toLowerCase() === "guru";

            return (
              <div key={msg.id || index} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[75%] gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${
                    isGuru ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  }`}>
                    {getInitials(senderName)}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-bold text-slate-600">{isMe ? "Saya" : senderName}</span>
                      {isGuru && !isMe && (
                         <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wide">GURU</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">{formatTime(msg.created_at)}</span>
                    </div>
                    
                    
                    <div 
                      className={`message-bubble-container relative px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-all select-none ${
                        isMe 
                          ? "bg-blue-600 text-white rounded-tr-sm" 
                          : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm"
                      } ${msg.is_optimistic ? "opacity-70" : "opacity-100"} ${
                        showDeleteMenuId === msg.id ? "ring-2 ring-rose-400 scale-[0.98]" : ""
                      }`}
                      onTouchStart={() => handleTouchStart(msg.id, isMe, isGuru)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd} // batal jika diswipe/scroll
                      onMouseDown={() => handleTouchStart(msg.id, isMe, isGuru)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                      onContextMenu={(e) => {
                         // Cegah konteks menu default jika menekan lama di HP (mobile browsers)
                         if (isMe || isGuru) e.preventDefault();
                      }}
                    >
                      {msg.pesan}
                      
                      {/* Delete Popup Menu */}
                      {showDeleteMenuId === msg.id && (
                        <div className={`absolute top-0 transform -translate-y-full mb-1 z-20 ${isMe ? "right-0" : "left-0"}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={deletingId === msg.id}
                            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-1.5 whitespace-nowrap transition-colors"
                          >
                            {deletingId === msg.id ? (
                              <svg className="h-3 w-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            Hapus Obrolan
                          </button>
                          {/* Triangle Pointer */}
                          <div className={`absolute bottom-[-4px] w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-rose-500 ${isMe ? "right-3" : "left-3"}`}></div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 flex items-center transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 shadow-inner">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Tulis pesan diskusi..."
              className="w-full bg-transparent border-none resize-none max-h-32 min-h-[44px] px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {sending ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

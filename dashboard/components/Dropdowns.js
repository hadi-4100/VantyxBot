"use client";
import React from "react";
import { createPortal } from "react-dom";
import {
  Search,
  ChevronDown,
  Check,
  X,
  Hash,
  MessageSquare,
} from "lucide-react";

/**
 * Portal component to render children at the end of document.body
 */
const DropdownPortal = ({ children }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};

/**
 * Base Dropdown container that handles the fixed positioning and overlay via Portal.
 */
const DropdownContainer = ({
  dropdownId,
  dropdownState,
  children,
  searchPlaceholder = "Search...",
}) => {
  const { activeId, position, search, setSearch, closeDropdown } =
    dropdownState;
  const isOpen = activeId === dropdownId;

  if (!isOpen) return null;

  const margin = 12;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const triggerBottom = position.triggerBottom || position.top;
  const triggerTop = position.triggerTop || triggerBottom - 48; // fallback
  const width = position.width;

  const spaceBelow = vh - triggerBottom - margin;
  const spaceAbove = triggerTop - margin;

  // Decide direction: open down if there's room for a 300px menu,
  // or flip if there's more space above.
  const DESIRED_HEIGHT = 300;
  const openUpward = spaceBelow < DESIRED_HEIGHT && spaceAbove > spaceBelow;

  let maxHeight;
  let topValue = "auto";
  let bottomValue = "auto";
  let finalLeft = position.left;

  if (openUpward) {
    maxHeight = Math.min(DESIRED_HEIGHT, spaceAbove - 8);
    bottomValue = `${vh - triggerTop + 8}px`;
  } else {
    maxHeight = Math.min(DESIRED_HEIGHT, spaceBelow - 8);
    topValue = `${triggerBottom + 8}px`;
  }

  // Horizontal clamping
  if (finalLeft + width > vw - margin) {
    finalLeft = vw - width - margin;
  }
  if (finalLeft < margin) {
    finalLeft = margin;
  }

  return (
    <DropdownPortal>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={(e) => {
          e.stopPropagation();
          closeDropdown();
        }}
      />

      {/* Dropdown Content */}
      <div
        className={`fixed bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[9999] overflow-hidden flex flex-col transition-all duration-200 ${
          openUpward ? "animate-fade-in-up" : "animate-fade-in-down"
        }`}
        style={{
          top: topValue,
          bottom: bottomValue,
          left: `${finalLeft}px`,
          width: `${width}px`,
          maxHeight: `${maxHeight}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b border-white/10 bg-white/5 shrink-0">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary/50"
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </DropdownPortal>
  );
};

/**
 * Single Select Dropdown for Roles
 */
export const RoleSelector = ({
  roles,
  selected,
  onChange,
  dropdownId,
  dropdownState,
  placeholder = "Select a role...",
}) => {
  const { activeId, toggleDropdown, closeDropdown, search } = dropdownState;
  const isOpen = activeId === dropdownId;
  const selectedRole = roles.find((r) => r.id === selected);

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown(dropdownId, e.currentTarget);
        }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:bg-white/10 transition-all min-h-[48px]"
      >
        {selectedRole ? (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor: selectedRole.color
                  ? `#${selectedRole.color.toString(16).padStart(6, "0")}`
                  : "#99AAB5",
              }}
            />
            <span className="text-sm text-white truncate">
              {selectedRole.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">{placeholder}</span>
        )}
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 text-gray-500 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownContainer
        dropdownId={dropdownId}
        dropdownState={dropdownState}
        searchPlaceholder="Search roles..."
      >
        {filteredRoles.map((role) => {
          const colorHex = role.color
            ? `#${role.color.toString(16).padStart(6, "0")}`
            : "#99AAB5";
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                onChange(role.id);
                closeDropdown();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-all text-left ${
                selected === role.id ? "bg-primary/10" : ""
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: colorHex }}
              />
              <span
                className="text-sm text-white truncate"
                style={{ color: colorHex !== "#000000" ? colorHex : "inherit" }}
              >
                {role.name}
              </span>
              {selected === role.id && (
                <Check size={14} className="ml-auto text-primary" />
              )}
            </button>
          );
        })}
        {filteredRoles.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No roles found
          </div>
        )}
      </DropdownContainer>
    </div>
  );
};

/**
 * Single Select Dropdown for Channels
 */
export const ChannelSelector = ({
  channels,
  selected,
  onChange,
  dropdownId,
  dropdownState,
  placeholder = "Select a channel...",
}) => {
  const { activeId, toggleDropdown, closeDropdown, search } = dropdownState;
  const isOpen = activeId === dropdownId;
  const selectedChannel = channels.find((c) => c.id === selected);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown(dropdownId, e.currentTarget);
        }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:bg-white/10 transition-all min-h-[48px]"
      >
        {selectedChannel ? (
          <div className="flex items-center gap-2">
            <Hash size={16} className="text-primary/70 shrink-0" />
            <span className="text-sm text-white truncate">
              {selectedChannel.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-400 truncate">
              {placeholder}
            </span>
          </div>
        )}
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 text-gray-500 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownContainer
        dropdownId={dropdownId}
        dropdownState={dropdownState}
        searchPlaceholder="Search channels..."
      >
        {filteredChannels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            onClick={() => {
              onChange(channel.id);
              closeDropdown();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-all text-left ${
              selected === channel.id ? "bg-primary/10" : ""
            }`}
          >
            <Hash size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-white truncate">{channel.name}</span>
            {selected === channel.id && (
              <Check size={14} className="ml-auto text-primary" />
            )}
          </button>
        ))}
        {filteredChannels.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No channels found
          </div>
        )}
      </DropdownContainer>
    </div>
  );
};

/**
 * Helper function to get Discord avatar URL
 */
const getAvatarUrl = (member) => {
  if (member.avatar) {
    return `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.${
      member.avatar.startsWith("a_") ? "gif" : "png"
    }?size=64`;
  }
  // Default Discord avatar based on discriminator or user ID
  const defaultAvatarIndex = member.discriminator
    ? parseInt(member.discriminator) % 5
    : (parseInt(member.id) >> 22) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
};

/**
 * Multi Select Dropdown for Members
 */
export const MemberSelector = ({
  members,
  selected = [],
  onToggle,
  dropdownId,
  dropdownState,
  placeholder = "Select members...",
}) => {
  const { activeId, toggleDropdown, search } = dropdownState;
  const isOpen = activeId === dropdownId;

  const filteredMembers = members.filter((m) => {
    const searchLower = search.toLowerCase();
    return (
      m.username?.toLowerCase().includes(searchLower) ||
      m.displayName?.toLowerCase().includes(searchLower) ||
      m.id?.includes(search)
    );
  });

  const selectedMembers = members.filter((m) => selected.includes(m.id));

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown(dropdownId, e.currentTarget);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(dropdownId, e.currentTarget);
          }
        }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-white transition-all duration-200 flex items-center justify-between hover:bg-white/10 min-h-[48px] cursor-pointer"
      >
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {selectedMembers.length > 0 ? (
            selectedMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 group bg-red-500/20 border border-red-500/40 text-red-400"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getAvatarUrl(member)}
                  alt={member.displayName}
                  className="w-4 h-4 rounded-full"
                />
                <span className="max-w-[120px] truncate">
                  {member.displayName}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(member.id);
                  }}
                  className="ml-0.5 hover:bg-white/20 rounded p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 text-gray-500 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      <DropdownContainer
        dropdownId={dropdownId}
        dropdownState={dropdownState}
        searchPlaceholder="Search members..."
      >
        {filteredMembers.map((member) => {
          const isSelected = selected.includes(member.id);
          return (
            <button
              key={member.id}
              onClick={() => onToggle(member.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isSelected ? "bg-primary border-primary" : "border-gray-600"
                }`}
              >
                {isSelected && <Check size={10} className="text-white" />}
              </div>
              <img
                src={getAvatarUrl(member)}
                alt={member.displayName}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">
                  {member.displayName}
                </div>
                {member.displayName !== member.username && (
                  <div className="text-xs text-gray-500 truncate">
                    @{member.username}
                  </div>
                )}
              </div>
              {member.bot && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                  BOT
                </span>
              )}
            </button>
          );
        })}
        {filteredMembers.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No members found
          </div>
        )}
      </DropdownContainer>
    </div>
  );
};

/**
 * Multi Select Dropdown for Roles or Channels
 */
export const MultiSelector = ({
  items,
  selected = [],
  onToggle,
  dropdownId,
  dropdownState,
  placeholder = "Select items...",
  type = "role",
}) => {
  const { activeId, toggleDropdown, search } = dropdownState;
  const isOpen = activeId === dropdownId;

  const filteredItems = items.filter((i) =>
    (i.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedItems = items.filter((i) => selected.includes(i.id));

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown(dropdownId, e.currentTarget);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(dropdownId, e.currentTarget);
          }
        }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-white transition-all duration-200 flex items-center justify-between hover:bg-white/10 min-h-[48px] cursor-pointer"
      >
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => {
              const colorHex =
                type === "role"
                  ? item.color
                    ? `#${item.color.toString(16).padStart(6, "0")}`
                    : "#99AAB5"
                  : "#3b82f6";
              return (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 group"
                  style={{
                    backgroundColor: `${colorHex}20`,
                    border: `1px solid ${colorHex}40`,
                    color: colorHex,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className="max-w-[120px] truncate">{item.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(item.id);
                    }}
                    className="ml-0.5 hover:bg-white/20 rounded p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 text-gray-500 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      <DropdownContainer dropdownId={dropdownId} dropdownState={dropdownState}>
        {filteredItems.map((item) => {
          const isSelected = selected.includes(item.id);
          const colorHex =
            type === "role"
              ? item.color
                ? `#${item.color.toString(16).padStart(6, "0")}`
                : "#99AAB5"
              : null;
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isSelected ? "bg-primary border-primary" : "border-gray-600"
                }`}
              >
                {isSelected && <Check size={10} className="text-white" />}
              </div>
              {type === "role" && colorHex && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colorHex }}
                ></div>
              )}
              {type === "channel" && (
                <Hash size={14} className="text-gray-400" />
              )}
              <span
                className="text-sm text-white flex-1 truncate"
                style={{
                  color:
                    type === "role" && colorHex && colorHex !== "#000000"
                      ? colorHex
                      : "inherit",
                }}
              >
                {item.name}
              </span>
            </button>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No items found
          </div>
        )}
      </DropdownContainer>
    </div>
  );
};

/**
 * Most generic dropdown used in welcomer page
 */
export const GenericSelector = ({
  label,
  value,
  selected,
  options,
  onChange,
  dropdownId,
  dropdownState,
  placeholder = "Select...",
  type = "single",
  className = "",
  buttonClassName = "",
  displayValue = null,
}) => {
  const { activeId, toggleDropdown, closeDropdown, search } = dropdownState;
  const isOpen = activeId === dropdownId;
  const finalValue = value !== undefined ? value : selected;

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown(dropdownId, e.currentTarget);
        }}
        className={
          buttonClassName ||
          "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-white transition-all duration-200 flex items-center justify-between hover:bg-white/10 min-h-[48px]"
        }
      >
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {type === "multi" ? (
            finalValue && finalValue.length > 0 ? (
              options
                .filter((opt) => finalValue.includes(opt.id))
                .map((opt) => (
                  <span
                    key={opt.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/20 border border-primary/40 text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="max-w-[120px] truncate">{opt.name}</span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(finalValue.filter((id) => id !== opt.id));
                      }}
                      className="ml-0.5 hover:bg-white/20 rounded p-0.5 transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </span>
                  </span>
                ))
            ) : (
              <span className="text-sm text-gray-400">{placeholder}</span>
            )
          ) : (
            <span className="text-sm truncate">
              {displayValue
                ? displayValue(finalValue)
                : finalValue
                ? options.find((o) => o.id === finalValue)?.name || finalValue
                : placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform text-gray-500 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownContainer dropdownId={dropdownId} dropdownState={dropdownState}>
        {filteredOptions.map((opt) => {
          const isSelected =
            type === "multi"
              ? finalValue?.includes(opt.id)
              : finalValue === opt.id;
          const colorHex = opt.color
            ? `#${opt.color.toString(16).padStart(6, "0")}`
            : null;
          return (
            <button
              key={opt.id}
              onClick={() => {
                if (type === "multi") {
                  const newValue = finalValue?.includes(opt.id)
                    ? finalValue.filter((v) => v !== opt.id)
                    : [...(finalValue || []), opt.id];
                  onChange(newValue);
                } else {
                  onChange(opt.id);
                  closeDropdown();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              {type === "multi" && (
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? "bg-primary border-primary" : "border-gray-600"
                  }`}
                >
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
              )}
              {colorHex && colorHex !== "#000000" && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colorHex }}
                ></div>
              )}
              <span
                className="text-sm text-white flex-1 truncate"
                style={{
                  color:
                    colorHex && colorHex !== "#000000" ? colorHex : "inherit",
                }}
              >
                {opt.name}
              </span>
              {type !== "multi" && isSelected && (
                <Check size={14} className="text-primary" />
              )}
            </button>
          );
        })}
        {filteredOptions.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No options found
          </div>
        )}
      </DropdownContainer>
    </div>
  );
};

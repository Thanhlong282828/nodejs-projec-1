// Tương tự cấu hình $table / timestamps của Eloquent.
export const modelOptions = (tableName) => ({
  tableName,
  timestamps: true,
  underscored: true,
});

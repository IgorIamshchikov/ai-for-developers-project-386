# Тип события: категория звонка в календаре владельца (contract/main.tsp).
class EventType < ApplicationRecord
  validates :title, presence: true
  validates :description, presence: true
  validates :duration_minutes, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
end

# Бронирование: занятие посетителем свободного слота (contract/main.tsp).
# Пересечение интервалов между Бронированиями любого Типа события исключается
# на уровне БД exclusion-constraint'ом (db/migrate/*_create_bookings.rb) — это
# и есть защита от гонки двух запросов на один слот.
class Booking < ApplicationRecord
  GRID_STEP = 30.minutes
  WINDOW_DAYS = 14

  belongs_to :event_type

  validates :visitor_name, presence: true
  validates :visitor_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :starts_at, presence: true

  validate :starts_at_on_grid
  validate :starts_at_in_future
  validate :starts_at_within_window

  before_validation :set_ends_at

  def self.window_end(now: Time.current)
    now.utc.beginning_of_day + WINDOW_DAYS.days
  end

  private

  def set_ends_at
    return unless starts_at && event_type

    self.ends_at = starts_at + event_type.duration_minutes.minutes
  end

  def starts_at_on_grid
    return if starts_at.blank?

    aligned = starts_at.sec.zero? && starts_at.usec.zero? && (starts_at.min % 30).zero?
    errors.add(:starts_at, "must fall on the 30-minute grid") unless aligned
  end

  def starts_at_in_future
    return if starts_at.blank?

    errors.add(:starts_at, "must be in the future") if starts_at <= Time.current
  end

  def starts_at_within_window
    return if starts_at.blank?

    errors.add(:starts_at, "must be within the 14-day booking window") if starts_at >= self.class.window_end
  end
end

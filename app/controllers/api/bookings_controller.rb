# Wired to the contract (contract/main.tsp, config/routes.rb).
module Api
  class BookingsController < ApplicationController
    def index
      render json: Booking.where("starts_at >= ?", Time.current).order(:starts_at).map { |booking| booking_json(booking) }
    end

    def create
      event_type = find_event_type(booking_params[:event_type_id])
      booking = event_type.bookings.new(booking_params.except(:event_type_id))

      if booking.save
        render json: booking_json(booking), status: :created
      else
        render json: validation_error(booking), status: :unprocessable_content
      end
    rescue ActiveRecord::ExclusionViolation
      render json: { error: { code: "slot_taken", message: "This slot is already booked" } }, status: :conflict
    end

    private

    def find_event_type(id)
      EventType.find(id)
    rescue ActiveRecord::StatementInvalid
      raise ActiveRecord::RecordNotFound
    end

    def booking_params
      params.permit(:eventTypeId, :startsAt, :visitorName, :visitorEmail).to_h.transform_keys do |key|
        PARAM_KEYS.fetch(key, key)
      end
    end

    PARAM_KEYS = {
      "eventTypeId" => :event_type_id,
      "startsAt" => :starts_at,
      "visitorName" => :visitor_name,
      "visitorEmail" => :visitor_email
    }.freeze
    private_constant :PARAM_KEYS

    def booking_json(booking)
      {
        id: booking.id,
        eventTypeId: booking.event_type_id,
        startsAt: booking.starts_at.iso8601,
        visitorName: booking.visitor_name,
        visitorEmail: booking.visitor_email
      }
    end

    def validation_error(booking)
      { error: { code: "validation", message: booking.errors.full_messages.to_sentence } }
    end
  end
end
